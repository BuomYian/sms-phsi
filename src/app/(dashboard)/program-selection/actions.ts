"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { programSelectionSchema } from "@/lib/validators";
import { headers } from "next/headers";

const FOUNDATION_YEAR_CODE = "FOUND-Y1";

export async function submitProgramSelection(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    throw new Error("Unauthorized");
  }

  const raw = {
    requestedProgramId: formData.get("requestedProgramId") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = programSelectionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const student = await db.student.findUnique({
    where: { userId: session.id },
    include: { program: true, programSelections: true },
  });

  if (!student) return { error: "Student record not found." };

  if (student.program.code !== FOUNDATION_YEAR_CODE) {
    return { error: "Only Foundation Year students can submit a program selection." };
  }

  const active = student.programSelections.find(
    (s) => s.status === "PENDING" || s.status === "APPROVED",
  );
  if (active) {
    return {
      error:
        active.status === "APPROVED"
          ? "Your program selection has already been approved."
          : "You already have a pending program selection request.",
    };
  }

  const targetProgram = await db.program.findUnique({
    where: { id: parsed.data.requestedProgramId },
  });
  if (!targetProgram || targetProgram.code === FOUNDATION_YEAR_CODE) {
    return { error: "Invalid program selected." };
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? undefined;

  await db.programSelection.create({
    data: {
      studentId: student.id,
      requestedProgramId: parsed.data.requestedProgramId,
      notes: parsed.data.notes,
    },
  });

  await logAction(
    session.id,
    "SUBMIT_PROGRAM_SELECTION",
    "ProgramSelection",
    undefined,
    { requestedProgram: targetProgram.name },
    ip ?? undefined,
  );

  revalidatePath("/program-selection");
  redirect("/program-selection");
}

export async function approveProgramSelection(selectionId: string) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
    throw new Error("Unauthorized");
  }

  const selection = await db.programSelection.findUnique({
    where: { id: selectionId },
    include: { student: true, requestedProgram: true },
  });

  if (!selection) return { error: "Selection request not found." };
  if (selection.status !== "PENDING") return { error: "Request is not pending." };

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? undefined;

  await db.$transaction([
    db.programSelection.update({
      where: { id: selectionId },
      data: {
        status: "APPROVED",
        reviewedBy: session.id,
        reviewedAt: new Date(),
      },
    }),
    db.student.update({
      where: { id: selection.studentId },
      data: {
        programId: selection.requestedProgramId,
        yearOfStudy: 2,
      },
    }),
  ]);

  await logAction(
    session.id,
    "APPROVE_PROGRAM_SELECTION",
    "ProgramSelection",
    selectionId,
    {
      studentId: selection.studentId,
      newProgram: selection.requestedProgram.name,
    },
    ip ?? undefined,
  );

  revalidatePath("/program-selection");
  revalidatePath(`/students/${selection.student.userId}`);
}

export async function rejectProgramSelection(selectionId: string, notes: string) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
    throw new Error("Unauthorized");
  }

  const selection = await db.programSelection.findUnique({
    where: { id: selectionId },
  });

  if (!selection) return { error: "Selection request not found." };
  if (selection.status !== "PENDING") return { error: "Request is not pending." };

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? undefined;

  await db.programSelection.update({
    where: { id: selectionId },
    data: {
      status: "REJECTED",
      reviewedBy: session.id,
      reviewedAt: new Date(),
      notes,
    },
  });

  await logAction(
    session.id,
    "REJECT_PROGRAM_SELECTION",
    "ProgramSelection",
    selectionId,
    { notes },
    ip ?? undefined,
  );

  revalidatePath("/program-selection");
}
