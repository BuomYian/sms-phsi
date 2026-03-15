"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { generateReceiptNumber } from "@/lib/utils";
import type { FeeCategory, PaymentMethod } from "@prisma/client";

export type FeeActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function createFeeStructureAction(
  _prevState: FeeActionState,
  formData: FormData,
): Promise<FeeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

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
      // Check for active scholarship
      const scholarship = await db.scholarship.findFirst({
        where: {
          studentId: student.id,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      });

      const amountCharged = Number(feeStructure.amount);
      let balance = amountCharged;
      let status = "UNPAID";

      if (scholarship) {
        let discount = 0;
        if (scholarship.percentage) {
          discount = amountCharged * (scholarship.percentage / 100);
        } else if (scholarship.amount) {
          discount = Math.min(Number(scholarship.amount), amountCharged);
        }
        balance = amountCharged - discount;
        status = balance <= 0 ? "PAID" : "UNPAID";
      }

      await db.studentFee.create({
        data: {
          studentId: student.id,
          feeStructureId,
          amountCharged: feeStructure.amount,
          amountPaid: 0,
          balance,
          status,
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
      const feeBalance = Number(fee.balance);
      const applied = Math.min(remaining, feeBalance);
      const newPaid = Number(fee.amountPaid) + applied;
      const newBalance = Number(fee.amountCharged) - newPaid;

      await db.studentFee.update({
        where: { id: fee.id },
        data: {
          amountPaid: newPaid,
          balance: newBalance,
          status: newBalance <= 0 ? "PAID" : "PARTIAL",
        },
      });
      remaining -= applied;
    }

    await logAction(session.id, "CREATE", "Payment", payment.id, {
      studentId,
      amount,
      method: paymentMethod,
      receipt: payment.receiptNumber,
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

export async function createScholarshipAction(
  _prevState: FeeActionState,
  formData: FormData,
): Promise<FeeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

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
