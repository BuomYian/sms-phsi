"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { SubjectType } from "@prisma/client";
import {
  createProgramSchema,
  createSubjectSchema,
  createDepartmentSchema,
} from "@/lib/validators";
import { revalidatePath } from "next/cache";

export type AcademicActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

// --------------- Programs ---------------
export async function createProgramAction(
  _prevState: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const data = {
    ...raw,
    durationSemesters: raw.durationSemesters
      ? Number(raw.durationSemesters)
      : undefined,
    totalCredits: raw.totalCredits ? Number(raw.totalCredits) : undefined,
  };

  const parsed = createProgramSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const input = parsed.data;

  try {
    const existing = await db.program.findUnique({
      where: { code: input.code },
    });
    if (existing) return { error: "A program with this code already exists." };

    const program = await db.program.create({
      data: {
        name: input.name,
        code: input.code,
        durationSemesters: input.durationSemesters,
        totalCredits: input.totalCredits,
        departmentId: input.departmentId,
        description: input.description || null,
        entryRequirements: input.entryRequirements || null,
      },
    });

    await logAction(session.id, "CREATE", "Program", program.id, {
      name: input.name,
      code: input.code,
    });

    revalidatePath("/academics/programs");
    return { success: true, message: `Program "${input.name}" created.` };
  } catch (error) {
    console.error("Create program error:", error);
    return { error: "Failed to create program." };
  }
}

export async function updateProgramAction(
  id: string,
  _prevState: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());

  try {
    const program = await db.program.findUnique({ where: { id } });
    if (!program) return { error: "Program not found." };

    await db.program.update({
      where: { id },
      data: {
        name: (raw.name as string) || undefined,
        departmentId: (raw.departmentId as string) || undefined,
        durationSemesters: raw.durationSemesters
          ? Number(raw.durationSemesters)
          : undefined,
        totalCredits: raw.totalCredits ? Number(raw.totalCredits) : undefined,
        description: (raw.description as string) || null,
        entryRequirements: (raw.entryRequirements as string) || null,
        isActive: raw.isActive === "on",
      },
    });

    await logAction(session.id, "UPDATE", "Program", id, {
      name: raw.name as string,
      code: program.code,
    });

    revalidatePath(`/academics/programs/${id}`);
    revalidatePath("/academics/programs");

    return { success: true, message: "Program updated successfully." };
  } catch (error) {
    console.error("Update program error:", error);
    return { error: "Failed to update program." };
  }
}

// --------------- Subjects ---------------
export async function createSubjectAction(
  _prevState: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const data = {
    ...raw,
    creditHours: raw.creditHours ? Number(raw.creditHours) : undefined,
    semesterNumber: raw.semesterNumber ? Number(raw.semesterNumber) : undefined,
  };

  const parsed = createSubjectSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const input = parsed.data;

  try {
    const existing = await db.subject.findUnique({
      where: { code: input.code },
    });
    if (existing) return { error: "A subject with this code already exists." };

    const subject = await db.subject.create({
      data: {
        name: input.name,
        code: input.code,
        creditHours: input.creditHours,
        programId: input.programId,
        semesterNumber: input.semesterNumber ?? 1,
        description: input.description || null,
        type: input.type || "CORE",
      },
    });

    await logAction(session.id, "CREATE", "Subject", subject.id, {
      name: input.name,
      code: input.code,
    });

    revalidatePath("/academics/subjects");
    return { success: true, message: `Subject "${input.name}" created.` };
  } catch (error) {
    console.error("Create subject error:", error);
    return { error: "Failed to create subject." };
  }
}

export async function updateSubjectAction(
  id: string,
  _prevState: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const typeValue =
    typeof raw.type === "string" &&
    (Object.values(SubjectType) as string[]).includes(raw.type)
      ? (raw.type as SubjectType)
      : undefined;

  try {
    const subject = await db.subject.findUnique({ where: { id } });
    if (!subject) return { error: "Subject not found." };

    await db.subject.update({
      where: { id },
      data: {
        name: (raw.name as string) || undefined,
        programId: (raw.programId as string) || undefined,
        creditHours: raw.creditHours ? Number(raw.creditHours) : undefined,
        semesterNumber: raw.semesterNumber
          ? Number(raw.semesterNumber)
          : undefined,
        type: typeValue,
        description: (raw.description as string) || null,
      },
    });

    await logAction(session.id, "UPDATE", "Subject", id, {
      name: raw.name as string,
      code: subject.code,
    });

    revalidatePath(`/academics/subjects/${id}`);
    revalidatePath("/academics/subjects");

    return { success: true, message: "Subject updated successfully." };
  } catch (error) {
    console.error("Update subject error:", error);
    return { error: "Failed to update subject." };
  }
}

// --------------- Departments ---------------
export async function createDepartmentAction(
  _prevState: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());

  const parsed = createDepartmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const input = parsed.data;

  try {
    const existing = await db.department.findUnique({
      where: { name: input.name },
    });
    if (existing)
      return { error: "A department with this name already exists." };

    const dept = await db.department.create({
      data: {
        name: input.name,
        code: input.code,
        headOfDepartmentId: input.headOfDepartmentId || null,
      },
    });

    await logAction(session.id, "CREATE", "Department", dept.id, {
      name: input.name,
    });

    revalidatePath("/academics/departments");
    return { success: true, message: `Department "${input.name}" created.` };
  } catch (error) {
    console.error("Create department error:", error);
    return { error: "Failed to create department." };
  }
}

export async function updateDepartmentAction(
  id: string,
  _prevState: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());

  try {
    const dept = await db.department.findUnique({ where: { id } });
    if (!dept) return { error: "Department not found." };

    await db.department.update({
      where: { id },
      data: {
        name: (raw.name as string) || undefined,
        code: (raw.code as string) || null,
        headOfDepartmentId:
          raw.headOfDepartmentId === "none"
            ? null
            : (raw.headOfDepartmentId as string) || null,
      },
    });

    await logAction(session.id, "UPDATE", "Department", id, {
      name: raw.name as string,
    });

    revalidatePath(`/academics/departments/${id}`);
    revalidatePath("/academics/departments");

    return { success: true, message: "Department updated successfully." };
  } catch (error) {
    console.error("Update department error:", error);
    return { error: "Failed to update department." };
  }
}

// --------------- Academic Year ---------------
export async function createAcademicYearAction(
  _prevState: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const isCurrent = formData.get("isCurrent") === "true";

  if (!name || !startDate || !endDate) {
    return { error: "Name, start date, and end date are required." };
  }

  try {
    if (isCurrent) {
      await db.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const ay = await db.academicYear.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent,
      },
    });

    await logAction(session.id, "CREATE", "AcademicYear", ay.id, { name });

    revalidatePath("/academics/calendar");
    return { success: true, message: `Academic year "${name}" created.` };
  } catch (error) {
    console.error("Create academic year error:", error);
    return { error: "Failed to create academic year." };
  }
}

export async function updateAcademicYearAction(
  id: string,
  _prevState: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const isCurrent = formData.get("isCurrent") === "true";

  if (!name || !startDate || !endDate) {
    return { error: "Name, start date, and end date are required." };
  }

  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.academicYear.findUnique({ where: { id } });
      if (!existing) throw new Error("Not found");

      if (isCurrent && !existing.isCurrent) {
        await tx.academicYear.updateMany({
          where: { isCurrent: true },
          data: { isCurrent: false },
        });
      }

      await tx.academicYear.update({
        where: { id },
        data: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isCurrent,
        },
      });
    });

    await logAction(session.id, "UPDATE", "AcademicYear", id, { name });

    revalidatePath("/academics/calendar");
    revalidatePath(`/academics/calendar/${id}`);
    return { success: true, message: `Academic year "${name}" updated.` };
  } catch (error) {
    console.error("Update academic year error:", error);
    return { error: "Failed to update academic year." };
  }
}

export async function deleteAcademicYearAction(
  id: string,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    const ay = await db.academicYear.findUnique({
      where: { id },
      include: {
        semesters: {
          include: {
            _count: { select: { enrollments: true } },
          },
        },
      },
    });
    if (!ay) return { error: "Academic year not found." };

    const hasEnrollments = ay.semesters.some((s) => s._count.enrollments > 0);
    if (hasEnrollments) {
      return {
        error:
          "Cannot delete this academic year because it has semesters with enrollments.",
      };
    }

    await db.$transaction(async (tx) => {
      await tx.semester.deleteMany({ where: { academicYearId: id } });
      await tx.academicYear.delete({ where: { id } });
    });

    await logAction(session.id, "DELETE", "AcademicYear", id, {
      name: ay.name,
    });

    revalidatePath("/academics/calendar");
    return { success: true, message: `Academic year "${ay.name}" deleted.` };
  } catch (error) {
    console.error("Delete academic year error:", error);
    return { error: "Failed to delete academic year." };
  }
}

// --------------- Semesters ---------------
export async function createSemesterAction(
  _prevState: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const academicYearId = formData.get("academicYearId") as string;
  const name = formData.get("name") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const isCurrent = formData.get("isCurrent") === "true";

  if (!academicYearId || !name || !startDate || !endDate) {
    return {
      error: "Academic year, name, start date, and end date are required.",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      if (isCurrent) {
        await tx.semester.updateMany({
          where: { isCurrent: true },
          data: { isCurrent: false },
        });
      }

      await tx.semester.create({
        data: {
          academicYearId,
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isCurrent,
        },
      });
    });

    await logAction(session.id, "CREATE", "Semester", academicYearId, {
      name,
    });

    revalidatePath("/academics/calendar");
    revalidatePath(`/academics/calendar/${academicYearId}`);
    return { success: true, message: `Semester "${name}" created.` };
  } catch (error) {
    console.error("Create semester error:", error);
    return { error: "Failed to create semester." };
  }
}

export async function updateSemesterAction(
  id: string,
  _prevState: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const isCurrent = formData.get("isCurrent") === "true";

  if (!name || !startDate || !endDate) {
    return { error: "Name, start date, and end date are required." };
  }

  try {
    const sem = await db.semester.findUnique({ where: { id } });
    if (!sem) return { error: "Semester not found." };

    await db.$transaction(async (tx) => {
      if (isCurrent && !sem.isCurrent) {
        await tx.semester.updateMany({
          where: { isCurrent: true },
          data: { isCurrent: false },
        });
      }

      await tx.semester.update({
        where: { id },
        data: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isCurrent,
        },
      });
    });

    await logAction(session.id, "UPDATE", "Semester", id, { name });

    revalidatePath("/academics/calendar");
    revalidatePath(`/academics/calendar/${sem.academicYearId}`);
    return { success: true, message: `Semester "${name}" updated.` };
  } catch (error) {
    console.error("Update semester error:", error);
    return { error: "Failed to update semester." };
  }
}

export async function deleteSemesterAction(
  id: string,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    const sem = await db.semester.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!sem) return { error: "Semester not found." };

    if (sem._count.enrollments > 0) {
      return {
        error: "Cannot delete this semester because it has enrollments.",
      };
    }

    await db.semester.delete({ where: { id } });

    await logAction(session.id, "DELETE", "Semester", id, { name: sem.name });

    revalidatePath("/academics/calendar");
    revalidatePath(`/academics/calendar/${sem.academicYearId}`);
    return { success: true, message: `Semester "${sem.name}" deleted.` };
  } catch (error) {
    console.error("Delete semester error:", error);
    return { error: "Failed to delete semester." };
  }
}

// --------------- Subject Instructor Assignment ---------------
export async function assignInstructorAction(
  subjectId: string,
  staffId: string,
  academicYearId: string,
  semesterId: string,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
    return { error: "Unauthorized" };
  }

  try {
    const existing = await db.subjectInstructor.findFirst({
      where: { subjectId, staffId, semesterId },
    });
    if (existing) {
      return {
        error:
          "This instructor is already assigned to this subject for this semester.",
      };
    }

    await db.subjectInstructor.create({
      data: { subjectId, staffId, academicYearId, semesterId },
    });

    const [subject, staff] = await Promise.all([
      db.subject.findUnique({
        where: { id: subjectId },
        select: { name: true, code: true },
      }),
      db.staff.findUnique({
        where: { id: staffId },
        include: { user: { select: { fullName: true } } },
      }),
    ]);

    await logAction(session.id, "CREATE", "SubjectInstructor", subjectId, {
      subject: subject?.code,
      instructor: staff?.user.fullName,
    });

    revalidatePath(`/academics/subjects/${subjectId}`);
    return {
      success: true,
      message: `Instructor "${staff?.user.fullName}" assigned to "${subject?.name}".`,
    };
  } catch (error) {
    console.error("Assign instructor error:", error);
    return { error: "Failed to assign instructor." };
  }
}

export async function unassignInstructorAction(
  assignmentId: string,
  subjectId: string,
): Promise<AcademicActionState> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
    return { error: "Unauthorized" };
  }

  try {
    const assignment = await db.subjectInstructor.findUnique({
      where: { id: assignmentId },
      include: {
        staff: { include: { user: { select: { fullName: true } } } },
        subject: { select: { name: true, code: true } },
      },
    });
    if (!assignment) return { error: "Assignment not found." };

    await db.subjectInstructor.delete({ where: { id: assignmentId } });

    await logAction(session.id, "DELETE", "SubjectInstructor", assignmentId, {
      subject: assignment.subject.code,
      instructor: assignment.staff.user.fullName,
    });

    revalidatePath(`/academics/subjects/${subjectId}`);
    return {
      success: true,
      message: `Instructor "${assignment.staff.user.fullName}" removed from "${assignment.subject.name}".`,
    };
  } catch (error) {
    console.error("Unassign instructor error:", error);
    return { error: "Failed to unassign instructor." };
  }
}
