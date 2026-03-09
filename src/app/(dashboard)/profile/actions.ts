"use server";

import { db } from "@/lib/db";
import {
  getSession,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { type Role } from "@/types";

export type ProfileActionState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!fullName) return { error: "Full name is required." };

  try {
    await db.user.update({
      where: { id: session.id },
      data: { fullName, phone },
    });

    // Refresh the session token so sidebar shows updated name
    const updatedUser = await db.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        avatarUrl: true,
      },
    });

    if (updatedUser) {
      const token = await createSessionToken({
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role as Role,
        fullName: updatedUser.fullName,
        avatarUrl: updatedUser.avatarUrl ?? null,
      });
      await setSessionCookie(token);
    }

    await logAction(session.id, "UPDATE", "User", session.id, {
      field: "profile",
    });

    revalidatePath("/profile");
    return { success: true, message: "Profile updated successfully." };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: "Failed to update profile." };
  }
}

export async function changePasswordAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const currentPassword = (formData.get("currentPassword") as string) ?? "";
  const newPassword = (formData.get("newPassword") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All password fields are required." };
  }

  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { passwordHash: true },
    });

    if (!user) return { error: "User not found." };

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return { error: "Current password is incorrect." };

    const passwordHash = await hashPassword(newPassword);
    await db.user.update({
      where: { id: session.id },
      data: { passwordHash },
    });

    await logAction(session.id, "UPDATE", "User", session.id, {
      field: "password",
    });

    return { success: true, message: "Password changed successfully." };
  } catch (error) {
    console.error("Change password error:", error);
    return { error: "Failed to change password." };
  }
}
