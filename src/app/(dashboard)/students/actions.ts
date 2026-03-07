"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { createStudentSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { generateStudentId } from "@/lib/utils";
import { StudentStatus } from "@/types";

export type StudentActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function createStudentAction(
  _prevState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());

  const data = {
    ...raw,
    previousGradYear: raw.previousGradYear
      ? Number(raw.previousGradYear)
      : undefined,
  };

  const parsed = createStudentSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: `${firstError.path.join(".")}: ${firstError.message}` };
  }

  const input = parsed.data;

  try {
    // Check if email is already taken
    const existingUser = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existingUser) {
      return { error: "A user with this email already exists." };
    }

    // Generate student ID
    const currentYear = new Date().getFullYear();
    const studentCount = await db.student.count();
    const studentIdNumber = generateStudentId(currentYear, studentCount + 1);

    // Create user account + student profile in a transaction
    const result = await db.$transaction(async (tx) => {
      const defaultPassword = `PHSI-${currentYear}`;
      const passwordHash = await hashPassword(defaultPassword);

      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          role: "STUDENT",
          fullName: input.fullName,
          phone: input.phone || null,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentIdNumber,
          programId: input.programId,
          admissionDate: new Date(),
          gender: input.gender,
          dob: new Date(input.dob),
          nationality: input.nationality || "South Sudanese",
          nationalId: input.nationalId || null,
          address: input.address || null,
          stateCounty: input.stateCounty || null,
          admissionType: input.admissionType || "REGULAR",
          guardianName: input.guardianName || null,
          guardianPhone: input.guardianPhone || null,
          guardianEmail: input.guardianEmail || null,
          guardianRelationship: input.guardianRelationship || null,
          guardianAddress: input.guardianAddress || null,
          previousSchool: input.previousSchool || null,
          previousQualification: input.previousQualification || null,
          previousGradYear: input.previousGradYear || null,
          bloodType: input.bloodType || null,
          allergies: input.allergies || null,
          disabilities: input.disabilities || null,
          medicalNotes: input.medicalNotes || null,
          emergencyContact: input.emergencyContact || null,
        },
      });

      return { user, student };
    });

    await logAction(session.id, "CREATE", "Student", result.student.id, {
      studentIdNumber,
      name: input.fullName,
    });

    revalidatePath("/students");

    return {
      success: true,
      message: `Student ${input.fullName} registered successfully with ID: ${studentIdNumber}`,
    };
  } catch (error) {
    console.error("Create student error:", error);
    return { error: "Failed to create student. Please try again." };
  }
}

export async function updateStudentAction(
  id: string,
  _prevState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());

  try {
    const student = await db.student.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!student) return { error: "Student not found." };

    await db.student.update({
      where: { id },
      data: {
        nationality: (raw.nationality as string) || undefined,
        nationalId: (raw.nationalId as string) || undefined,
        address: (raw.address as string) || undefined,
        stateCounty: (raw.stateCounty as string) || undefined,
        guardianName: (raw.guardianName as string) || undefined,
        guardianPhone: (raw.guardianPhone as string) || undefined,
        guardianEmail: (raw.guardianEmail as string) || undefined,
        guardianRelationship: (raw.guardianRelationship as string) || undefined,
        guardianAddress: (raw.guardianAddress as string) || undefined,
        bloodType: (raw.bloodType as string) || undefined,
        allergies: (raw.allergies as string) || undefined,
        disabilities: (raw.disabilities as string) || undefined,
        medicalNotes: (raw.medicalNotes as string) || undefined,
        emergencyContact: (raw.emergencyContact as string) || undefined,
      },
    });

    // Update linked user fullName/phone if provided
    const fullName = raw.fullName as string | undefined;
    const phone = raw.phone as string | undefined;
    if (fullName || phone) {
      await db.user.update({
        where: { id: student.userId },
        data: {
          ...(fullName ? { fullName } : {}),
          ...(phone ? { phone } : {}),
        },
      });
    }

    await logAction(session.id, "UPDATE", "Student", id, {
      studentIdNumber: student.studentIdNumber,
    });

    revalidatePath(`/students/${id}`);
    revalidatePath("/students");

    return { success: true, message: "Student updated successfully." };
  } catch (error) {
    console.error("Update student error:", error);
    return { error: "Failed to update student. Please try again." };
  }
}

export async function updateStudentStatusAction(
  id: string,
  status: string,
): Promise<StudentActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    const student = await db.student.update({
      where: { id },
      data: { status: status as StudentStatus },
    });

    // Deactivate user if student is suspended/withdrawn
    if (status === "SUSPENDED" || status === "WITHDRAWN") {
      await db.user.update({
        where: { id: student.userId },
        data: { isActive: false },
      });
    } else if (status === "ACTIVE") {
      await db.user.update({
        where: { id: student.userId },
        data: { isActive: true },
      });
    }

    await logAction(session.id, "UPDATE", "Student", id, {
      action: "status_change",
      newStatus: status,
      studentIdNumber: student.studentIdNumber,
    });

    revalidatePath(`/students/${id}`);
    revalidatePath("/students");

    return { success: true, message: `Student status updated to ${status}.` };
  } catch (error) {
    console.error("Update status error:", error);
    return { error: "Failed to update student status." };
  }
}

export async function deleteStudentAction(
  id: string,
): Promise<StudentActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    const student = await db.student.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!student) return { error: "Student not found." };

    await db.$transaction(async (tx) => {
      await tx.student.delete({ where: { id } });
      await tx.user.delete({ where: { id: student.userId } });
    });

    await logAction(session.id, "DELETE", "Student", id, {
      studentIdNumber: student.studentIdNumber,
      name: student.user.fullName,
    });

    revalidatePath("/students");

    return { success: true, message: "Student deleted successfully." };
  } catch (error) {
    console.error("Delete student error:", error);
    return { error: "Failed to delete student." };
  }
}
