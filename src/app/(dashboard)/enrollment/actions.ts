"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type EnrollmentActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function createEnrollmentAction(
  _prevState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const studentId = formData.get("studentId") as string;
  const semesterId = formData.get("semesterId") as string;
  const subjectIds = formData.getAll("subjectIds") as string[];

  if (!studentId || !semesterId) {
    return { error: "Student and semester are required." };
  }

  if (subjectIds.length === 0) {
    return { error: "Select at least one subject." };
  }

  try {
    // Check for duplicate enrollment
    const existing = await db.enrollment.findFirst({
      where: { studentId, semesterId },
    });
    if (existing) {
      return { error: "Student is already enrolled in this semester." };
    }

    // Check total credit hours
    const subjects = await db.subject.findMany({
      where: { id: { in: subjectIds } },
    });
    const totalCredits = subjects.reduce((sum, s) => sum + s.creditHours, 0);
    if (totalCredits > 24) {
      return {
        error: `Total credit hours (${totalCredits}) exceed the maximum of 24.`,
      };
    }

    const enrollment = await db.enrollment.create({
      data: {
        studentId,
        semesterId,
        status: "PENDING",
        courseEnrollments: {
          create: subjectIds.map((subjectId) => ({ subjectId })),
        },
      },
    });

    await logAction(session.id, "CREATE", "Enrollment", enrollment.id, {
      studentId,
      semesterId,
      subjects: subjectIds.length,
    });

    revalidatePath("/enrollment");
    return {
      success: true,
      message: `Enrollment created with ${subjectIds.length} subject(s), ${totalCredits} credit hours.`,
    };
  } catch (error) {
    console.error("Create enrollment error:", error);
    return { error: "Failed to create enrollment." };
  }
}

export async function approveEnrollmentAction(
  enrollmentId: string,
): Promise<EnrollmentActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await db.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "APPROVED" },
    });

    await logAction(session.id, "UPDATE", "Enrollment", enrollmentId, {
      action: "approved",
    });

    revalidatePath("/enrollment");
    return { success: true, message: "Enrollment approved." };
  } catch (error) {
    console.error("Approve enrollment error:", error);
    return { error: "Failed to approve enrollment." };
  }
}

export async function rejectEnrollmentAction(
  enrollmentId: string,
): Promise<EnrollmentActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await db.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "REJECTED" },
    });

    await logAction(session.id, "UPDATE", "Enrollment", enrollmentId, {
      action: "rejected",
    });

    revalidatePath("/enrollment");
    return { success: true, message: "Enrollment rejected." };
  } catch (error) {
    console.error("Reject enrollment error:", error);
    return { error: "Failed to reject enrollment." };
  }
}
