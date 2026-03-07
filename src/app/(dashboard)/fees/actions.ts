"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { generateReceiptNumber } from "@/lib/utils";

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
  const currency = (formData.get("currency") as string) || "SSP";
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
        category: category as any,
        amount,
        currency: currency as any,
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

export async function assignFeeToStudentAction(
  _prevState: FeeActionState,
  formData: FormData,
): Promise<FeeActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const studentId = formData.get("studentId") as string;
  const feeStructureId = formData.get("feeStructureId") as string;

  if (!studentId || !feeStructureId) {
    return { error: "Student and fee structure are required." };
  }

  try {
    const feeStructure = await db.feeStructure.findUnique({
      where: { id: feeStructureId },
    });
    if (!feeStructure) return { error: "Fee structure not found." };

    await db.studentFee.create({
      data: {
        studentId,
        feeStructureId,
        amountCharged: feeStructure.amount,
        amountPaid: 0,
        balance: feeStructure.amount,
        status: "UNPAID",
      },
    });

    await logAction(session.id, "CREATE", "StudentFee", studentId, {
      feeStructureId,
    });

    revalidatePath("/fees");
    return { success: true, message: "Fee assigned to student." };
  } catch (error) {
    console.error("Assign fee error:", error);
    return { error: "Failed to assign fee." };
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
  const currency = (formData.get("currency") as string) || "SSP";
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
        currency: currency as any,
        paymentMethod: paymentMethod as any,
        referenceNumber: referenceNumber || null,
        receiptNumber: generateReceiptNumber(new Date().getFullYear(), paymentCount + 1),
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
