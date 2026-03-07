"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth/password";

export type SettingsActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function updateSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const entries = Array.from(formData.entries());
  const updates: { key: string; value: string; category: string }[] = [];

  for (const [key, value] of entries) {
    if (key.startsWith("setting_")) {
      const settingKey = key.replace("setting_", "");
      const category =
        (formData.get(`category_${settingKey}`) as string) || "general";
      updates.push({ key: settingKey, value: value as string, category });
    }
  }

  try {
    for (const { key, value, category } of updates) {
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value, category },
      });
    }

    await logAction(session.id, "UPDATE", "Setting", undefined, {
      count: updates.length,
    });

    revalidatePath("/settings");
    return { success: true, message: `${updates.length} settings updated.` };
  } catch (error) {
    console.error("Update settings error:", error);
    return { error: "Failed to update settings." };
  }
}

export async function createUserAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;

  if (!fullName || !email || !role || !password) {
    return { error: "All fields are required." };
  }

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return { error: "Email already in use." };

    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({
      data: {
        fullName,
        email,
        passwordHash: hashedPassword,
        role: role as any,
      },
    });

    await logAction(session.id, "CREATE", "User", user.id, {
      email,
      role,
    });

    revalidatePath("/settings/users");
    return { success: true, message: `User ${email} created.` };
  } catch (error) {
    console.error("Create user error:", error);
    return { error: "Failed to create user." };
  }
}

export async function toggleUserStatusAction(
  userId: string,
): Promise<SettingsActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found." };

    await db.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    await logAction(session.id, "UPDATE", "User", userId, {
      action: user.isActive ? "deactivated" : "activated",
    });

    revalidatePath("/settings/users");
    return {
      success: true,
      message: `User ${user.isActive ? "deactivated" : "activated"}.`,
    };
  } catch (error) {
    console.error("Toggle user error:", error);
    return { error: "Failed to update user." };
  }
}
