"use server";

import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { loginSchema } from "@/lib/validators";
import { redirect } from "next/navigation";
import { type Role } from "@/types";

export type LoginState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid email or password format." };
  }

  const { email, password } = parsed.data;

  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return { error: "Invalid email or password." };
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      return {
        error: `Account is locked due to too many failed attempts. Try again in ${minutes} minute(s).`,
      };
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      // Increment login attempts
      const attempts = user.loginAttempts + 1;
      const lockout =
        attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await db.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil: lockout,
        },
      });

      if (lockout) {
        return {
          error: "Too many failed attempts. Account locked for 15 minutes.",
        };
      }

      return { error: "Invalid email or password." };
    }

    // Reset login attempts on success
    if (user.loginAttempts > 0) {
      await db.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: null },
      });
    }

    // Create session
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role as Role,
      fullName: user.fullName,
    });

    await setSessionCookie(token);

    // Audit log
    await logAction(user.id, "LOGIN", "User", user.id, { email: user.email });
  } catch (error) {
    console.error("Login error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }

  redirect("/dashboard");
}
