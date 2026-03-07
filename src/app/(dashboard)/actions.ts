"use server";

import { getSession, destroySession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await logAction(session.id, "LOGOUT", "User", session.id, {
      email: session.email,
    });
  }
  await destroySession();
  redirect("/login");
}

export async function getCurrentUser() {
  return getSession();
}
