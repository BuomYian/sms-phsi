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

/**
 * Every grade consumer — transcripts, the student's own results, the review
 * queue — renders from live Grade rows, so a mutation has to revalidate all of
 * them. Revalidating only "/grades" is why a corrected mark could appear not to
 * have saved at all.
 */
function revalidateGradePaths(studentIds: string[] = []) {
  revalidatePath("/grades");
  revalidatePath("/grades/review");
  revalidatePath("/grades/enter");
  revalidatePath("/grades/transcripts");
  revalidatePath("/grades/my-results");
  revalidatePath("/dashboard");
  // Dynamic route: the concrete path is required. Passing the literal
  // "[studentId]" segment silently revalidates nothing.
  for (const studentId of new Set(studentIds)) {
    revalidatePath(`/grades/transcripts/${studentId}`);
  }
}

export async function submitGradeAction(
  _prevState: GradeActionState,
  formData: FormData,
): Promise<GradeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  if (
    session.role !== "SUPER_ADMIN" &&
    session.role !== "ADMIN" &&
    session.role !== "INSTRUCTOR"
  ) {
    return { error: "Only instructors and administrators can submit grades." };
  }

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
      include: {
        enrollment: { select: { status: true, studentId: true } },
        grade: { select: { status: true } },
      },
    });

    if (!courseEnrollment) {
      return { error: "Course enrollment not found." };
    }

    if (courseEnrollment.enrollment.status !== "APPROVED") {
      return { error: "Cannot submit grades for unapproved enrollments." };
    }

    // Approval is a lock. Re-submitting an approved grade used to reset it to
    // SUBMITTED, which dropped the result off every transcript (they all filter
    // on APPROVED) while leaving a stale approver stamp behind. Corrections to
    // an approved grade go through amendGradeAction so they are snapshotted and
    // audited; PUBLISHED is covered so a future publish step cannot reopen it.
    if (
      courseEnrollment.grade?.status === "APPROVED" ||
      courseEnrollment.grade?.status === "PUBLISHED"
    ) {
      return {
        error:
          "This grade has already been approved and is locked. Ask an administrator to amend it.",
      };
    }

    const isEdit = Boolean(courseEnrollment.grade);

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

    await logAction(
      session.id,
      isEdit ? "UPDATE" : "CREATE",
      "Grade",
      courseEnrollmentId,
      { caMarks, examMarks, totalMarks, gradeLetter },
    );

    revalidateGradePaths([courseEnrollment.enrollment.studentId]);
    return {
      success: true,
      message: `Grade submitted: ${gradeLetter} (${totalMarks}%)`,
    };
  } catch (error) {
    console.error("Submit grade error:", error);
    return { error: "Failed to submit grade." };
  }
}

/**
 * Admin-only correction of an existing grade, including an APPROVED one.
 *
 * The grade keeps its status and its original approvedBy/approvedDate, so a
 * correction reaches transcripts immediately with no re-approval step. The
 * superseded marks are snapshotted onto the same row so a registrar can see
 * what changed without reading the audit log.
 */
export async function amendGradeAction(
  _prevState: GradeActionState,
  formData: FormData,
): Promise<GradeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    return { error: "Only administrators can amend grades." };
  }

  const gradeId = formData.get("gradeId") as string;
  const caMarks = parseFloat(formData.get("caMarks") as string);
  const examMarks = parseFloat(formData.get("examMarks") as string);
  const reason = ((formData.get("reason") as string) ?? "").trim();

  if (!gradeId || isNaN(caMarks) || isNaN(examMarks)) {
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
    const existing = await db.grade.findUnique({
      where: { id: gradeId },
      select: {
        caMarks: true,
        examMarks: true,
        totalMarks: true,
        gradeLetter: true,
        status: true,
        courseEnrollment: {
          select: {
            subject: { select: { code: true } },
            enrollment: { select: { studentId: true } },
          },
        },
      },
    });

    if (!existing) return { error: "Grade not found." };

    // Without this, re-saving unchanged marks would overwrite the real
    // previous* snapshot with the already-current values and destroy the
    // history — the exact thing someone does when they think a save failed.
    if (existing.caMarks === caMarks && existing.examMarks === examMarks) {
      return { error: "No change — the marks are the same." };
    }

    await db.grade.update({
      where: { id: gradeId },
      data: {
        // Snapshot what is being superseded, before overwriting it.
        previousCaMarks: existing.caMarks,
        previousExamMarks: existing.examMarks,
        previousTotalMarks: existing.totalMarks,
        previousGradeLetter: existing.gradeLetter,
        caMarks,
        examMarks,
        totalMarks,
        gradeLetter,
        gpaPoints,
        amendedBy: session.id,
        amendedDate: new Date(),
        amendmentReason: reason || null,
        // status, approvedBy and approvedDate are deliberately NOT touched:
        // an amended grade stays APPROVED so the correction is live at once.
      },
    });

    const studentId = existing.courseEnrollment.enrollment.studentId;

    // The audit viewer renders only the first ~80 characters of this payload,
    // so the action and a compact before/after lead; the detail trails after.
    await logAction(session.id, "UPDATE", "Grade", gradeId, {
      action: "amended",
      change: `${existing.totalMarks ?? "—"} → ${totalMarks}`,
      subject: existing.courseEnrollment.subject.code,
      status: existing.status,
      studentId,
      before: {
        caMarks: existing.caMarks,
        examMarks: existing.examMarks,
        totalMarks: existing.totalMarks,
        gradeLetter: existing.gradeLetter,
      },
      after: { caMarks, examMarks, totalMarks, gradeLetter },
      reason: reason || null,
    });

    revalidateGradePaths([studentId]);
    return {
      success: true,
      message: `Grade amended: ${gradeLetter} (${totalMarks}%)`,
    };
  } catch (error) {
    console.error("Amend grade error:", error);
    return { error: "Failed to amend grade." };
  }
}

export async function approveGradeAction(
  gradeId: string,
): Promise<GradeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    return { error: "Only administrators can approve grades." };
  }

  try {
    const grade = await db.grade.update({
      where: { id: gradeId },
      data: {
        status: "APPROVED",
        approvedBy: session.id,
        approvedDate: new Date(),
      },
      select: {
        courseEnrollment: {
          select: { enrollment: { select: { studentId: true } } },
        },
      },
    });

    await logAction(session.id, "UPDATE", "Grade", gradeId, {
      action: "approved",
    });

    revalidateGradePaths([grade.courseEnrollment.enrollment.studentId]);
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
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    return { error: "Only administrators can reject grades." };
  }

  try {
    const grade = await db.grade.update({
      where: { id: gradeId },
      // Clear the approval stamps too — otherwise a grade rejected after
      // approval keeps pointing at an approver who no longer approves it.
      data: { status: "DRAFT", approvedBy: null, approvedDate: null },
      select: {
        courseEnrollment: {
          select: { enrollment: { select: { studentId: true } } },
        },
      },
    });

    await logAction(session.id, "UPDATE", "Grade", gradeId, {
      action: "rejected",
    });

    revalidateGradePaths([grade.courseEnrollment.enrollment.studentId]);
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
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    return { error: "Only administrators can approve grades." };
  }

  if (gradeIds.length === 0) return { error: "No grades selected." };

  try {
    // Capture the affected students before the update, so their transcripts
    // can be revalidated by concrete path.
    const affected = await db.grade.findMany({
      where: { id: { in: gradeIds }, status: "SUBMITTED" },
      select: {
        courseEnrollment: {
          select: { enrollment: { select: { studentId: true } } },
        },
      },
    });

    const result = await db.grade.updateMany({
      where: { id: { in: gradeIds }, status: "SUBMITTED" },
      data: {
        status: "APPROVED",
        approvedBy: session.id,
        approvedDate: new Date(),
      },
    });

    await logAction(session.id, "UPDATE", "Grade", "bulk-approve", {
      count: result.count,
    });

    revalidateGradePaths(
      affected.map((g) => g.courseEnrollment.enrollment.studentId),
    );
    // Report what actually changed — rows that were not SUBMITTED are skipped
    // by the filter above and must not be counted as approved.
    return {
      success: true,
      message: `${result.count} grade(s) approved.`,
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
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    return { error: "Only administrators can schedule exams." };
  }

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
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    return { error: "Only administrators can update exam schedules." };
  }

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
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    return { error: "Only administrators can delete exam schedules." };
  }

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
