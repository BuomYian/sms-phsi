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
    // Verify the enrollment is approved before allowing grade submission
    const courseEnrollment = await db.courseEnrollment.findUnique({
      where: { id: courseEnrollmentId },
      include: { enrollment: { select: { status: true } } },
    });

    if (!courseEnrollment) {
      return { error: "Course enrollment not found." };
    }

    if (courseEnrollment.enrollment.status !== "APPROVED") {
      return { error: "Cannot submit grades for unapproved enrollments." };
    }

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
      data: {
        status: "APPROVED",
        approvedBy: session.id,
        approvedDate: new Date(),
      },
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

export async function rejectGradeAction(
  gradeId: string,
): Promise<GradeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await db.grade.update({
      where: { id: gradeId },
      data: { status: "DRAFT" },
    });

    await logAction(session.id, "UPDATE", "Grade", gradeId, {
      action: "rejected",
    });

    revalidatePath("/grades");
    return { success: true, message: "Grade returned to draft." };
  } catch (error) {
    console.error("Reject grade error:", error);
    return { error: "Failed to reject grade." };
  }
}

export async function bulkApproveGradesAction(
  gradeIds: string[],
): Promise<GradeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  if (gradeIds.length === 0) return { error: "No grades selected." };

  try {
    await db.grade.updateMany({
      where: { id: { in: gradeIds }, status: "SUBMITTED" },
      data: {
        status: "APPROVED",
        approvedBy: session.id,
        approvedDate: new Date(),
      },
    });

    await logAction(session.id, "UPDATE", "Grade", "bulk-approve", {
      count: gradeIds.length,
    });

    revalidatePath("/grades");
    return {
      success: true,
      message: `${gradeIds.length} grade(s) approved.`,
    };
  } catch (error) {
    console.error("Bulk approve error:", error);
    return { error: "Failed to approve grades." };
  }
}

// ─── Exam Schedule ──────────────────────────────────────────

export async function createExamScheduleAction(
  _prevState: GradeActionState,
  formData: FormData,
): Promise<GradeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const subjectId = formData.get("subjectId") as string;
  const semesterId = formData.get("semesterId") as string;
  const classId = (formData.get("classId") as string) || null;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const venue = formData.get("venue") as string;
  const duration = parseInt(formData.get("duration") as string);

  if (
    !subjectId ||
    !semesterId ||
    !date ||
    !startTime ||
    !endTime ||
    !venue ||
    isNaN(duration)
  ) {
    return { error: "All fields are required." };
  }

  try {
    const exam = await db.examSchedule.create({
      data: {
        subjectId,
        semesterId,
        classId,
        date: new Date(date),
        startTime,
        endTime,
        venue,
        duration,
      },
    });

    await logAction(session.id, "CREATE", "ExamSchedule", exam.id, {
      subjectId,
      date,
    });

    revalidatePath("/grades/exams");
    return { success: true, message: "Exam scheduled." };
  } catch (error) {
    console.error("Create exam error:", error);
    return { error: "Failed to schedule exam." };
  }
}

export async function updateExamScheduleAction(
  _prevState: GradeActionState,
  formData: FormData,
): Promise<GradeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const id = formData.get("id") as string;
  const subjectId = formData.get("subjectId") as string;
  const semesterId = formData.get("semesterId") as string;
  const classId = (formData.get("classId") as string) || null;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const venue = formData.get("venue") as string;
  const duration = parseInt(formData.get("duration") as string);

  if (
    !id ||
    !subjectId ||
    !semesterId ||
    !date ||
    !startTime ||
    !endTime ||
    !venue ||
    isNaN(duration)
  ) {
    return { error: "All fields are required." };
  }

  try {
    await db.examSchedule.update({
      where: { id },
      data: {
        subjectId,
        semesterId,
        classId,
        date: new Date(date),
        startTime,
        endTime,
        venue,
        duration,
      },
    });

    await logAction(session.id, "UPDATE", "ExamSchedule", id, {
      subjectId,
      date,
    });

    revalidatePath("/grades/exams");
    return { success: true, message: "Exam schedule updated." };
  } catch (error) {
    console.error("Update exam error:", error);
    return { error: "Failed to update exam schedule." };
  }
}

export async function deleteExamScheduleAction(
  examId: string,
): Promise<GradeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await db.examSchedule.delete({ where: { id: examId } });

    await logAction(session.id, "DELETE", "ExamSchedule", examId);

    revalidatePath("/grades/exams");
    return { success: true, message: "Exam schedule deleted." };
  } catch (error) {
    console.error("Delete exam error:", error);
    return { error: "Failed to delete exam schedule." };
  }
}

function getLetterGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getGPAPoints(letter: string): number {
  const map: Record<string, number> = {
    A: 4.0,
    B: 3.0,
    C: 2.0,
    D: 1.0,
    F: 0.0,
  };
  return map[letter] ?? 0;
}
