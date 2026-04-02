"use server";

import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAction } from "@/lib/audit";

export type ResetState = {
  error?: string;
  success?: boolean;
  message?: string;
  step?: "email" | "question" | "done";
  securityQuestion?: string;
  email?: string;
};

export async function lookupSecurityQuestionAction(
  _prevState: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  if (!email) return { error: "Email is required.", step: "email" };

  const user = await db.user.findUnique({
    where: { email },
    select: { securityQuestion: true, isActive: true },
  });

  // Don't reveal whether account exists
  if (!user || !user.isActive || !user.securityQuestion) {
    return {
      error:
        "No security question found for this account. Contact an administrator to reset your password.",
      step: "email",
    };
  }

  return {
    step: "question",
    securityQuestion: user.securityQuestion,
    email,
  };
}

export async function resetPasswordAction(
  _prevState: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const answer = (formData.get("answer") as string)?.trim();
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !answer || !newPassword) {
    return { error: "All fields are required.", step: "question", email };
  }

  if (newPassword.length < 6) {
    return {
      error: "Password must be at least 6 characters.",
      step: "question",
      email,
    };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match.", step: "question", email };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, securityAnswer: true, securityQuestion: true },
  });

  if (!user || !user.securityAnswer) {
    return { error: "Invalid request.", step: "email" };
  }

  // Case-insensitive comparison against bcrypt hash
  const isCorrect = await verifyPassword(
    answer.toLowerCase(),
    user.securityAnswer,
  );
  if (!isCorrect) {
    return {
      error: "Incorrect security answer.",
      step: "question",
      email,
      securityQuestion: user.securityQuestion ?? undefined,
    };
  }

  const passwordHash = await hashPassword(newPassword);

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash, loginAttempts: 0, lockedUntil: null },
  });

  await logAction(user.id, "UPDATE", "User", user.id, {
    action: "password_reset_self_service",
  });

  return {
    success: true,
    step: "done",
    message: "Password reset successfully. You can now sign in.",
  };
}
