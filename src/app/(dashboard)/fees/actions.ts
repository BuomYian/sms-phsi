"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import {
  applyScholarshipToFee,
  activeScholarshipWhere,
  SCHOLARSHIP_PREFERENCE_ORDER,
  isFinanceRole,
  FEE_STATUS,
  round2,
  overlappingScholarshipWhere,
} from "@/lib/fees";
import { generateReceiptNumber } from "@/lib/utils";
import type { FeeCategory, PaymentMethod } from "@prisma/client";

export type FeeActionState = {
  error?: string;
  success?: boolean;
  message?: string;
  /** Set by sponsorClassAction — a bulk money mutation needs a visible receipt. */
  summary?: {
    className: string;
    students: number;
    scholarshipsCreated: number;
    scholarshipsSkipped: number;
    feesRecalculated: number;
    waivedTotal: number;
  };
};

/**
 * Paths that render fee money. Existing actions revalidated only "/fees",
 * which makes a successful mutation look like a failed one everywhere else.
 */
function revalidateFeePaths() {
  for (const path of [
    "/fees",
    "/fees/accounts",
    "/fees/reports",
    "/fees/scholarships",
    "/fees/my-fees",
    "/dashboard",
    "/reports",
    "/reports/financial",
    "/reports/summary",
    "/students",
  ]) {
    revalidatePath(path);
  }
}

export async function createFeeStructureAction(
  _prevState: FeeActionState,
  formData: FormData,
): Promise<FeeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  if (!isFinanceRole(session.role)) {
    return { error: "You do not have permission to manage fees." };
  }

  const programId = formData.get("programId") as string;
  const academicYearId = formData.get("academicYearId") as string;
  const semesterId = formData.get("semesterId") as string;
  const category = formData.get("category") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;

  if (
    !programId ||
    !academicYearId ||
    !semesterId ||
    !category ||
    isNaN(amount)
  ) {
    return { error: "All required fields must be filled." };
  }

  try {
    const fee = await db.feeStructure.create({
      data: {
        programId,
        academicYearId,
        semesterId,
        category: category as FeeCategory,
        amount,
        description: description || null,
      },
    });

    await logAction(session.id, "CREATE", "FeeStructure", fee.id, {
      category,
      amount,
    });

    revalidatePath("/fees");
    return { success: true, message: "Fee structure created." };
  } catch (error) {
    console.error("Create fee structure error:", error);
    return { error: "Failed to create fee structure." };
  }
}

export async function bulkAssignFeesAction(
  _prevState: FeeActionState,
  formData: FormData,
): Promise<FeeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  if (!isFinanceRole(session.role)) {
    return { error: "You do not have permission to manage fees." };
  }

  const feeStructureId = formData.get("feeStructureId") as string;
  if (!feeStructureId) return { error: "Fee structure is required." };

  try {
    const feeStructure = await db.feeStructure.findUnique({
      where: { id: feeStructureId },
      include: { program: true },
    });
    if (!feeStructure) return { error: "Fee structure not found." };

    // Get all active students in this program
    const students = await db.student.findMany({
      where: { programId: feeStructure.programId, status: "ACTIVE" },
      select: { id: true },
    });

    // Get students who already have this fee
    const existing = await db.studentFee.findMany({
      where: { feeStructureId },
      select: { studentId: true },
    });
    const existingIds = new Set(existing.map((e) => e.studentId));
    const toAssign = students.filter((s) => !existingIds.has(s.id));

    if (toAssign.length === 0) {
      return { error: "All students already have this fee assigned." };
    }

    const now = new Date();
    let assigned = 0;

    for (const student of toAssign) {
      const scholarship = await db.scholarship.findFirst({
        where: { studentId: student.id, ...activeScholarshipWhere(now) },
        orderBy: SCHOLARSHIP_PREFERENCE_ORDER,
      });

      const applied = applyScholarshipToFee({
        amountCharged: feeStructure.amount,
        amountPaid: 0,
        scholarship,
      });

      await db.studentFee.create({
        data: {
          studentId: student.id,
          feeStructureId,
          amountCharged: feeStructure.amount,
          amountPaid: 0,
          balance: applied.balance,
          status: applied.status,
          scholarshipId: applied.scholarshipId,
        },
      });
      assigned++;
    }

    await logAction(session.id, "CREATE", "StudentFee", feeStructureId, {
      bulkAssign: true,
      count: assigned,
    });

    revalidatePath("/fees");
    return {
      success: true,
      message: `Fee assigned to ${assigned} students. Scholarships auto-applied.`,
    };
  } catch (error) {
    console.error("Bulk assign fee error:", error);
    return { error: "Failed to bulk-assign fees." };
  }
}

export async function updateFeeStructureAction(
  id: string,
  _prevState: FeeActionState,
  formData: FormData,
): Promise<FeeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  if (!isFinanceRole(session.role)) {
    return { error: "You do not have permission to manage fees." };
  }

  const programId = formData.get("programId") as string;
  const academicYearId = formData.get("academicYearId") as string;
  const semesterId = formData.get("semesterId") as string;
  const category = formData.get("category") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;

  if (
    !programId ||
    !academicYearId ||
    !semesterId ||
    !category ||
    isNaN(amount)
  ) {
    return { error: "All required fields must be filled." };
  }

  try {
    await db.feeStructure.update({
      where: { id },
      data: {
        programId,
        academicYearId,
        semesterId,
        category: category as FeeCategory,
        amount,
        description: description || null,
      },
    });

    await logAction(session.id, "UPDATE", "FeeStructure", id, {
      category,
      amount,
    });

    revalidatePath("/fees");
    return { success: true, message: "Fee structure updated." };
  } catch (error) {
    console.error("Update fee structure error:", error);
    return { error: "Failed to update fee structure." };
  }
}

export async function deleteFeeStructureAction(
  id: string,
): Promise<FeeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  if (!isFinanceRole(session.role)) {
    return { error: "You do not have permission to manage fees." };
  }

  try {
    const hasStudentFees = await db.studentFee.count({
      where: { feeStructureId: id },
    });
    if (hasStudentFees > 0) {
      return {
        error:
          "Cannot delete fee structure with assigned student fees. Remove student fees first.",
      };
    }

    await db.feeStructure.delete({ where: { id } });
    await logAction(session.id, "DELETE", "FeeStructure", id, {});

    revalidatePath("/fees/structures");
    return { success: true, message: "Fee structure deleted." };
  } catch (error) {
    console.error("Delete fee structure error:", error);
    return { error: "Failed to delete fee structure." };
  }
}

export async function recordPaymentAction(
  _prevState: FeeActionState,
  formData: FormData,
): Promise<FeeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  if (!isFinanceRole(session.role)) {
    return { error: "You do not have permission to manage fees." };
  }

  const studentId = formData.get("studentId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const paymentMethod = formData.get("paymentMethod") as string;
  const referenceNumber = formData.get("referenceNumber") as string;
  const notes = formData.get("notes") as string;

  if (!studentId || isNaN(amount) || amount <= 0 || !paymentMethod) {
    return { error: "Student, amount, and payment method are required." };
  }

  try {
    const paymentCount = await db.payment.count();
    const payment = await db.payment.create({
      data: {
        studentId,
        amount,
        currency: "USD",
        paymentMethod: paymentMethod as PaymentMethod,
        referenceNumber: referenceNumber || null,
        receiptNumber: generateReceiptNumber(
          new Date().getFullYear(),
          paymentCount + 1,
        ),
        paymentDate: new Date(),
        notes: notes || null,
        recordedBy: session.id,
      },
    });

    // Auto-apply payment to outstanding fees
    let remaining = amount;
    const unpaidFees = await db.studentFee.findMany({
      where: {
        studentId,
        balance: { gt: 0 },
      },
      orderBy: { createdAt: "asc" },
    });

    for (const fee of unpaidFees) {
      if (remaining <= 0) break;
      const applied = Math.min(remaining, Number(fee.balance));
      if (applied <= 0) continue;

      const newPaid = round2(Number(fee.amountPaid) + applied);
      // Derive from the existing balance, NOT from amountCharged - newPaid.
      // The old form discarded any scholarship discount held in `balance`,
      // silently re-billing the waived portion on the next payment.
      const newBalance = round2(Number(fee.balance) - applied);

      await db.studentFee.update({
        where: { id: fee.id },
        data: {
          amountPaid: newPaid,
          balance: newBalance,
          status: newBalance <= 0 ? FEE_STATUS.PAID : FEE_STATUS.PARTIAL,
        },
      });
      remaining = round2(remaining - applied);
    }

    await logAction(session.id, "CREATE", "Payment", payment.id, {
      studentId,
      amount,
      method: paymentMethod,
      receipt: payment.receiptNumber,
      // Non-zero when the payment exceeded what was owed — normal for a
      // fully-sponsored student, whose fees all have a zero balance.
      unallocated: remaining,
    });

    revalidatePath("/fees");
    return {
      success: true,
      message: `Payment recorded. Receipt: ${payment.receiptNumber}`,
    };
  } catch (error) {
    console.error("Record payment error:", error);
    return { error: "Failed to record payment." };
  }
}

/**
 * Sponsor an entire class: create a scholarship for every active member and
 * retroactively recalculate the fees they have already been billed.
 *
 * Idempotent by design. Balance is recomputed from the immutable
 * `amountCharged` rather than decremented, and students who already hold an
 * overlapping award from the same sponsor are skipped — so a double-click, a
 * retry, or running it across overlapping classes all converge rather than
 * compounding.
 */
export async function sponsorClassAction(
  _prevState: FeeActionState,
  formData: FormData,
): Promise<FeeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  if (!isFinanceRole(session.role)) {
    return { error: "You do not have permission to manage fees." };
  }

  const classId = formData.get("classId") as string;
  const sponsorRaw = (formData.get("sponsor") as string) ?? "";
  const type = formData.get("type") as string;
  const coverageMode = formData.get("coverageMode") as string;
  const percentageRaw = formData.get("percentage") as string | null;
  const amountRaw = formData.get("amount") as string | null;
  const startRaw = formData.get("startDate") as string;
  const endRaw = formData.get("endDate") as string;
  const recalculate = formData.get("recalculateExisting") === "on";

  // Collapse whitespace so "Mission  21" cannot diverge from "Mission 21"
  // and silently defeat the dedupe on a later run.
  const sponsor = sponsorRaw.trim().replace(/\s+/g, " ");

  if (!classId || !sponsor || !type || !startRaw || !endRaw) {
    return { error: "All required fields must be filled." };
  }

  const usePercentage = coverageMode === "percentage";
  const percentage = usePercentage ? parseFloat(percentageRaw ?? "") : null;
  const amount = usePercentage ? null : parseFloat(amountRaw ?? "");

  if (usePercentage) {
    if (!Number.isFinite(percentage!) || percentage! <= 0 || percentage! > 100) {
      return { error: "Coverage percentage must be between 1 and 100." };
    }
  } else {
    if (!Number.isFinite(amount!) || amount! <= 0) {
      return { error: "Fixed amount must be greater than zero." };
    }
  }

  const startDate = new Date(startRaw);
  const endDate = new Date(endRaw);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Invalid start or end date." };
  }
  if (endDate <= startDate) {
    return { error: "End date must be after the start date." };
  }

  try {
    const cls = await db.academicClass.findUnique({
      where: { id: classId },
      select: { id: true, name: true },
    });
    if (!cls) return { error: "Class not found." };

    const members = await db.classStudent.findMany({
      where: { classId, status: "ACTIVE", student: { status: "ACTIVE" } },
      select: { studentId: true },
    });
    const studentIds = [...new Set(members.map((m) => m.studentId))];
    if (studentIds.length === 0) {
      return { error: "This class has no active students." };
    }

    // Who already holds an overlapping award from this same sponsor? This is
    // what stops a second run (or an overlapping class) double-awarding.
    const existing = await db.scholarship.findMany({
      where: {
        studentId: { in: studentIds },
        sponsor: { equals: sponsor, mode: "insensitive" },
        ...overlappingScholarshipWhere(startDate, endDate),
      },
      select: { id: true, studentId: true, percentage: true, amount: true },
    });
    const alreadySponsored = new Map(existing.map((e) => [e.studentId, e]));

    // Pre-generate ids so the fee rows can reference them without a read-back
    // inside the transaction.
    const newRows = studentIds
      .filter((id) => !alreadySponsored.has(id))
      .map((studentId) => ({
        id: crypto.randomUUID(),
        studentId,
        type,
        sponsor,
        percentage,
        amount,
        startDate,
        endDate,
      }));
    const newByStudent = new Map(newRows.map((r) => [r.studentId, r]));

    // Recalculate fees whose semester overlaps the award window. Scoping by
    // semester stops a transfer student's genuine historical debt being
    // retro-waived.
    const updates = [];
    let waivedTotal = 0;

    if (recalculate) {
      const fees = await db.studentFee.findMany({
        where: {
          studentId: { in: studentIds },
          feeStructure: {
            semester: {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          },
        },
        select: {
          id: true,
          studentId: true,
          amountCharged: true,
          amountPaid: true,
          balance: true,
          status: true,
          scholarshipId: true,
        },
      });

      for (const fee of fees) {
        const award =
          alreadySponsored.get(fee.studentId) ?? newByStudent.get(fee.studentId);
        if (!award) continue;

        const next = applyScholarshipToFee({
          amountCharged: fee.amountCharged,
          // Preserved, not zeroed: waive only the remainder, so cash the
          // school actually banked stays reconcilable against payments.
          amountPaid: fee.amountPaid,
          scholarship: award,
        });

        if (
          next.balance === Number(fee.balance) &&
          next.status === fee.status &&
          next.scholarshipId === fee.scholarshipId
        ) {
          continue; // already correct — skip the write
        }

        updates.push(
          db.studentFee.update({
            where: { id: fee.id },
            data: {
              balance: next.balance,
              status: next.status,
              scholarshipId: next.scholarshipId,
            },
          }),
        );
        waivedTotal = round2(waivedTotal + next.waivedAmount);
      }
    }

    if (newRows.length === 0 && updates.length === 0) {
      return {
        error: `Nothing to do — every active student in ${cls.name} is already sponsored by ${sponsor} for this period.`,
      };
    }

    // One transaction: this overwrites money columns, so a mid-loop failure
    // would otherwise leave the cohort half-sponsored.
    await db.$transaction([
      ...(newRows.length
        ? [db.scholarship.createMany({ data: newRows })]
        : []),
      ...updates,
    ]);

    // Outside the transaction: logAction swallows its own errors by design and
    // must never roll back real work.
    await logAction(session.id, "CREATE", "Scholarship", classId, {
      bulkSponsorClass: true,
      className: cls.name,
      sponsor,
      type,
      percentage,
      amount,
      created: newRows.length,
      skipped: alreadySponsored.size,
      feesRecalculated: updates.length,
      waivedTotal,
    });

    revalidateFeePaths();

    return {
      success: true,
      message: `${cls.name}: ${newRows.length} scholarship(s) created, ${updates.length} fee(s) recalculated.`,
      summary: {
        className: cls.name,
        students: studentIds.length,
        scholarshipsCreated: newRows.length,
        scholarshipsSkipped: alreadySponsored.size,
        feesRecalculated: updates.length,
        waivedTotal,
      },
    };
  } catch (error) {
    console.error("Sponsor class error:", error);
    return { error: "Failed to sponsor class." };
  }
}

export async function createScholarshipAction(
  _prevState: FeeActionState,
  formData: FormData,
): Promise<FeeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  if (!isFinanceRole(session.role)) {
    return { error: "You do not have permission to manage fees." };
  }

  const studentId = formData.get("studentId") as string;
  const type = formData.get("type") as string;
  const sponsor = formData.get("sponsor") as string;
  const amount = formData.get("amount")
    ? parseFloat(formData.get("amount") as string)
    : null;
  const percentage = formData.get("percentage")
    ? parseFloat(formData.get("percentage") as string)
    : null;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (!studentId || !type || !sponsor || !startDate || !endDate) {
    return { error: "All required fields must be filled." };
  }

  try {
    const scholarship = await db.scholarship.create({
      data: {
        studentId,
        type,
        sponsor,
        amount,
        percentage,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    await logAction(session.id, "CREATE", "Scholarship", scholarship.id, {
      type,
      sponsor,
    });

    revalidatePath("/fees/scholarships");
    return { success: true, message: "Scholarship created." };
  } catch (error) {
    console.error("Create scholarship error:", error);
    return { error: "Failed to create scholarship." };
  }
}
