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
  formData: FormData
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

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { error: "Invalid email or password." };
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
