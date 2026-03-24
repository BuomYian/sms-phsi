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
    const enrollment = await db.$transaction(async (tx) => {
      // Check for duplicate enrollment
      const existing = await tx.enrollment.findFirst({
        where: { studentId, semesterId },
      });
      if (existing) {
        throw new Error("Student is already enrolled in this semester.");
      }

      // Check total credit hours
      const subjects = await tx.subject.findMany({
        where: { id: { in: subjectIds } },
        include: {
          prerequisites: {
            include: {
              prerequisite: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });
      const totalCredits = subjects.reduce((sum, s) => sum + s.creditHours, 0);
      if (totalCredits > 24) {
        throw new Error(
          `Total credit hours (${totalCredits}) exceed the maximum of 24.`,
        );
      }

      // Check prerequisites - student must have passed all prerequisites
      const passedSubjects = await tx.grade.findMany({
        where: {
          courseEnrollment: {
            enrollment: { studentId, status: "APPROVED" },
          },
          status: "APPROVED",
          gradeLetter: { not: "F" },
        },
        select: {
          courseEnrollment: { select: { subjectId: true } },
        },
      });

      const passedSubjectIds = new Set(
        passedSubjects.map((g) => g.courseEnrollment.subjectId),
      );

      for (const subject of subjects) {
        for (const prereq of subject.prerequisites) {
          if (!passedSubjectIds.has(prereq.prerequisiteId)) {
            throw new Error(
              `Prerequisite not met: ${prereq.prerequisite.code} (${prereq.prerequisite.name}) is required for ${subject.code}.`,
            );
          }
        }
      }

      return await tx.enrollment.create({
        data: {
          studentId,
          semesterId,
          status: "PENDING",
          courseEnrollments: {
            create: subjectIds.map((subjectId) => ({ subjectId })),
          },
        },
        include: {
          courseEnrollments: { include: { subject: true } },
        },
      });
    });

    const totalCredits = enrollment.courseEnrollments.reduce(
      (sum, ce) => sum + ce.subject.creditHours,
      0,
    );

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
    const msg =
      error instanceof Error ? error.message : "Failed to create enrollment.";
    return { error: msg };
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
      data: {
        status: "APPROVED",
        approvedBy: session.id,
        approvedDate: new Date(),
      },
    });

    await logAction(session.id, "UPDATE", "Enrollment", enrollmentId, {
      action: "approved",
    });

    revalidatePath("/enrollment");
    revalidatePath(`/enrollment/${enrollmentId}`);
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
    revalidatePath(`/enrollment/${enrollmentId}`);
    return { success: true, message: "Enrollment rejected." };
  } catch (error) {
    console.error("Reject enrollment error:", error);
    return { error: "Failed to reject enrollment." };
  }
}

export async function setConditionalEnrollmentAction(
  enrollmentId: string,
  notes: string,
): Promise<EnrollmentActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await db.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "CONDITIONAL",
        notes,
        approvedBy: session.id,
        approvedDate: new Date(),
      },
    });

    await logAction(session.id, "UPDATE", "Enrollment", enrollmentId, {
      action: "conditional",
      notes,
    });

    revalidatePath("/enrollment");
    revalidatePath(`/enrollment/${enrollmentId}`);
    return {
      success: true,
      message: "Enrollment set to conditional.",
    };
  } catch (error) {
    console.error("Conditional enrollment error:", error);
    return { error: "Failed to update enrollment." };
  }
}

export async function updateEnrollmentSubjectsAction(
  enrollmentId: string,
  _prevState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const subjectIds = formData.getAll("subjectIds") as string[];

  if (subjectIds.length === 0) {
    return { error: "Select at least one subject." };
  }

  try {
    await db.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findUnique({
        where: { id: enrollmentId },
      });
      if (!enrollment) throw new Error("Enrollment not found.");

      if (
        enrollment.status !== "PENDING" &&
        enrollment.status !== "CONDITIONAL"
      ) {
        throw new Error(
          "Only pending or conditional enrollments can be modified.",
        );
      }

      const subjects = await tx.subject.findMany({
        where: { id: { in: subjectIds } },
      });
      const totalCredits = subjects.reduce((sum, s) => sum + s.creditHours, 0);
      if (totalCredits > 24) {
        throw new Error(
          `Total credit hours (${totalCredits}) exceed the maximum of 24.`,
        );
      }

      // Remove existing course enrollments and recreate
      await tx.courseEnrollment.deleteMany({
        where: { enrollmentId },
      });

      await tx.courseEnrollment.createMany({
        data: subjectIds.map((subjectId) => ({
          enrollmentId,
          subjectId,
        })),
      });

      // Reset to pending if it was conditional
      if (enrollment.status === "CONDITIONAL") {
        await tx.enrollment.update({
          where: { id: enrollmentId },
          data: { status: "PENDING", notes: null },
        });
      }
    });

    await logAction(session.id, "UPDATE", "Enrollment", enrollmentId, {
      action: "subjects_updated",
      subjects: subjectIds.length,
    });

    revalidatePath("/enrollment");
    revalidatePath(`/enrollment/${enrollmentId}`);
    return {
      success: true,
      message: `Subjects updated. ${subjectIds.length} subject(s) enrolled.`,
    };
  } catch (error) {
    console.error("Update enrollment subjects error:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to update enrollment subjects.";
    return { error: msg };
  }
}

export async function deleteEnrollmentAction(
  enrollmentId: string,
): Promise<EnrollmentActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        courseEnrollments: {
          include: { _count: { select: { attendances: true } } },
        },
      },
    });
    if (!enrollment) return { error: "Enrollment not found." };

    const hasAttendance = enrollment.courseEnrollments.some(
      (ce) => ce._count.attendances > 0,
    );
    if (hasAttendance) {
      return {
        error:
          "Cannot delete enrollment with attendance records. Reject it instead.",
      };
    }

    await db.$transaction(async (tx) => {
      await tx.courseEnrollment.deleteMany({ where: { enrollmentId } });
      await tx.enrollment.delete({ where: { id: enrollmentId } });
    });

    await logAction(session.id, "DELETE", "Enrollment", enrollmentId, {
      action: "deleted",
    });

    revalidatePath("/enrollment");
    return { success: true, message: "Enrollment deleted." };
  } catch (error) {
    console.error("Delete enrollment error:", error);
    return { error: "Failed to delete enrollment." };
  }
}
