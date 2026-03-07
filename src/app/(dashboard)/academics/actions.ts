"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
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
