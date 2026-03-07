"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type GradeActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function submitGradeAction(
  _prevState: GradeActionState,
  formData: FormData,
): Promise<GradeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const courseEnrollmentId = formData.get("courseEnrollmentId") as string;
  const caMarks = parseFloat(formData.get("caMarks") as string);
  const examMarks = parseFloat(formData.get("examMarks") as string);

  if (!courseEnrollmentId || isNaN(caMarks) || isNaN(examMarks)) {
    return { error: "All fields are required." };
  }

  if (caMarks < 0 || caMarks > 40) {
    return { error: "CA marks must be between 0 and 40." };
  }
  if (examMarks < 0 || examMarks > 60) {
    return { error: "Exam marks must be between 0 and 60." };
  }

  const totalMarks = caMarks + examMarks;
  const gradeLetter = getLetterGrade(totalMarks);
  const gpaPoints = getGPAPoints(gradeLetter);

  try {
    await db.grade.upsert({
      where: { courseEnrollmentId },
      update: {
        caMarks,
        examMarks,
        totalMarks,
        gradeLetter,
        gpaPoints,
        status: "SUBMITTED",
        submittedBy: session.id,
        submittedDate: new Date(),
      },
      create: {
        courseEnrollmentId,
        caMarks,
        examMarks,
        totalMarks,
        gradeLetter,
        gpaPoints,
        status: "SUBMITTED",
        submittedBy: session.id,
        submittedDate: new Date(),
      },
    });

    await logAction(session.id, "CREATE", "Grade", courseEnrollmentId, {
      caMarks,
      examMarks,
      totalMarks,
      gradeLetter,
    });

    revalidatePath("/grades");
    return {
      success: true,
      message: `Grade submitted: ${gradeLetter} (${totalMarks}%)`,
    };
  } catch (error) {
    console.error("Submit grade error:", error);
    return { error: "Failed to submit grade." };
  }
}

export async function approveGradeAction(
  gradeId: string,
): Promise<GradeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await db.grade.update({
      where: { id: gradeId },
      data: { status: "APPROVED" },
    });

    await logAction(session.id, "UPDATE", "Grade", gradeId, {
      action: "approved",
    });

    revalidatePath("/grades");
    return { success: true, message: "Grade approved." };
  } catch (error) {
    console.error("Approve grade error:", error);
    return { error: "Failed to approve grade." };
  }
}

function getLetterGrade(score: number): string {
  if (score >= 70) return "A";
  if (score >= 65) return "B+";
  if (score >= 60) return "B";
  if (score >= 55) return "C+";
  if (score >= 50) return "C";
  if (score >= 45) return "D";
  return "F";
}

function getGPAPoints(letter: string): number {
  const map: Record<string, number> = {
    A: 4.0,
    "B+": 3.5,
    B: 3.0,
    "C+": 2.5,
    C: 2.0,
    D: 1.5,
    F: 0.0,
  };
  return map[letter] ?? 0;
}
