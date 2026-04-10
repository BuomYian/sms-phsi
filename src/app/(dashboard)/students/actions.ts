"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { createStudentSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { generateStudentId } from "@/lib/utils";
import { StudentStatus } from "@/types";
import { AdmissionType } from "@prisma/client";

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

  // Map form field names to schema field names
  const firstName = ((raw.firstName as string) || "").trim();
  const middleName = ((raw.middleName as string) || "").trim();
  const lastName = ((raw.lastName as string) || "").trim();
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  const emergencyParts = [
    raw.emergencyContactName,
    raw.emergencyContactPhone,
  ].filter(Boolean);

  const data = {
    ...raw,
    fullName,
    dob: raw.dateOfBirth || raw.dob,
    bloodType: raw.bloodGroup || raw.bloodType,
    medicalNotes: raw.medicalConditions || raw.medicalNotes,
    emergencyContact: emergencyParts.length
      ? emergencyParts.join(" - ")
      : undefined,
    previousGradYear: raw.previousGradYear
      ? Number(raw.previousGradYear)
      : undefined,
  };

  const parsed = createStudentSchema.safeParse(data);
  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`,
    );
    console.error("Student validation errors:", errors);
    return { error: errors.join("; ") };
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
      const passwordHash = await hashPassword(studentIdNumber);

      const securityAnswerHash = await hashPassword("phsi");

      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          role: "STUDENT",
          fullName: input.fullName,
          phone: input.phone || null,
          securityQuestion: "What is the name of this institution?",
          securityAnswer: securityAnswerHash,
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
      message: `Student ${input.fullName} registered successfully. ID: ${studentIdNumber} (this is also their login password).`,
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
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")
    return { error: "Only administrators can edit student records." };

  const raw = Object.fromEntries(formData.entries());

  try {
    const result = await db.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { id },
        select: { userId: true, studentIdNumber: true },
      });
      if (!student) return null;

      await tx.student.update({
        where: { id },
        data: {
          programId: (raw.programId as string) || undefined,
          admissionType: raw.admissionType
            ? (raw.admissionType as AdmissionType)
            : undefined,
          yearOfStudy: raw.yearOfStudy ? Number(raw.yearOfStudy) : undefined,
          nationality: (raw.nationality as string) || undefined,
          nationalId: (raw.nationalId as string) || undefined,
          address: (raw.address as string) || undefined,
          stateCounty: (raw.stateCounty as string) || undefined,
          previousSchool: (raw.previousSchool as string) || undefined,
          previousQualification:
            (raw.previousQualification as string) || undefined,
          previousGradYear: raw.previousGradYear
            ? Number(raw.previousGradYear)
            : undefined,
          guardianName: (raw.guardianName as string) || undefined,
          guardianPhone: (raw.guardianPhone as string) || undefined,
          guardianEmail: (raw.guardianEmail as string) || undefined,
          guardianRelationship:
            (raw.guardianRelationship as string) || undefined,
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
        await tx.user.update({
          where: { id: student.userId },
          data: {
            ...(fullName ? { fullName } : {}),
            ...(phone ? { phone } : {}),
          },
        });
      }

      return student;
    });

    if (!result) return { error: "Student not found." };

    await logAction(session.id, "UPDATE", "Student", id, {
      studentIdNumber: result.studentIdNumber,
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
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")
    return { error: "Only administrators can change student status." };

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
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")
    return { error: "Only administrators can delete students." };

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

// ===========================
// BULK IMPORT
// ===========================

type ImportRow = {
  fullName: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
};

export type ImportResult = {
  error?: string;
  success?: boolean;
  message?: string;
  imported?: number;
  failed?: number;
  errors?: string[];
};

export async function importStudentsAction(
  rows: ImportRow[],
  programId: string,
): Promise<ImportResult> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  if (!rows.length) return { error: "No rows to import." };

  const currentYear = new Date().getFullYear();

  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    if (!row.fullName || !row.email || !row.gender) {
      errors.push(
        `Row ${rowNum}: Missing required fields (fullName, email, or gender).`,
      );
      continue;
    }

    const gender = row.gender.toUpperCase();
    if (gender !== "MALE" && gender !== "FEMALE") {
      errors.push(`Row ${rowNum}: Invalid gender "${row.gender}".`);
      continue;
    }

    try {
      const existing = await db.user.findUnique({
        where: { email: row.email.toLowerCase() },
      });
      if (existing) {
        errors.push(`Row ${rowNum}: Email ${row.email} already exists.`);
        continue;
      }

      const studentCount = await db.student.count();
      const studentIdNumber = generateStudentId(currentYear, studentCount + 1);
      const passwordHash = await hashPassword(studentIdNumber);

      await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: row.email.toLowerCase(),
            passwordHash,
            role: "STUDENT",
            fullName: row.fullName,
            phone: row.phone || null,
          },
        });

        await tx.student.create({
          data: {
            userId: user.id,
            studentIdNumber,
            programId,
            admissionDate: new Date(),
            gender: gender as "MALE" | "FEMALE",
            dob: row.dateOfBirth
              ? new Date(row.dateOfBirth)
              : new Date("2000-01-01"),
            nationality: "South Sudanese",
          },
        });
      });

      imported++;
    } catch (err) {
      console.error(`Import row ${rowNum} error:`, err);
      errors.push(`Row ${rowNum}: Failed to import ${row.fullName}.`);
    }
  }

  revalidatePath("/students");

  await logAction(session.id, "CREATE", "Student", "bulk-import", {
    imported,
    failed: errors.length,
  });

  return {
    success: true,
    message: `Imported ${imported} of ${rows.length} students.`,
    imported,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ===========================
// PARENT LINKING
// ===========================

export async function linkParentAction(
  studentId: string,
  parentUserId: string,
): Promise<StudentActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    return { error: "Only admins can link parents to students." };
  }

  try {
    const [student, parent] = await Promise.all([
      db.student.findUnique({
        where: { id: studentId },
        select: { id: true, studentIdNumber: true },
      }),
      db.user.findUnique({
        where: { id: parentUserId },
        select: { id: true, role: true, fullName: true },
      }),
    ]);

    if (!student) return { error: "Student not found." };
    if (!parent) return { error: "Parent user not found." };
    if (parent.role !== "PARENT")
      return { error: "Selected user is not a parent." };

    const existing = await db.parentStudent.findUnique({
      where: { parentId_studentId: { parentId: parentUserId, studentId } },
    });
    if (existing)
      return { error: "This parent is already linked to this student." };

    await db.parentStudent.create({
      data: { parentId: parentUserId, studentId },
    });

    await logAction(session.id, "CREATE", "ParentStudent", studentId, {
      parentId: parentUserId,
      parentName: parent.fullName,
    });

    revalidatePath(`/students/${studentId}`);
    return {
      success: true,
      message: `Parent "${parent.fullName}" linked successfully.`,
    };
  } catch (error) {
    console.error("Link parent error:", error);
    return { error: "Failed to link parent." };
  }
}

export async function unlinkParentAction(
  studentId: string,
  parentUserId: string,
): Promise<StudentActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    return { error: "Only admins can unlink parents from students." };
  }

  try {
    const link = await db.parentStudent.findUnique({
      where: { parentId_studentId: { parentId: parentUserId, studentId } },
    });
    if (!link) return { error: "Parent link not found." };

    await db.parentStudent.delete({ where: { id: link.id } });

    await logAction(session.id, "DELETE", "ParentStudent", studentId, {
      parentId: parentUserId,
    });

    revalidatePath(`/students/${studentId}`);
    return { success: true, message: "Parent unlinked successfully." };
  } catch (error) {
    console.error("Unlink parent error:", error);
    return { error: "Failed to unlink parent." };
  }
}
