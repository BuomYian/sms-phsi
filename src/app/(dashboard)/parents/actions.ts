"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { createParentSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export type ParentActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function createParentAction(
  _prevState: ParentActionState,
  formData: FormData,
): Promise<ParentActionState> {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")
  ) {
    return { error: "Unauthorized" };
  }

  const raw = Object.fromEntries(formData.entries());

  const firstName = ((raw.firstName as string) || "").trim();
  const middleName = ((raw.middleName as string) || "").trim();
  const lastName = ((raw.lastName as string) || "").trim();
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  const parsed = createParentSchema.safeParse({
    ...raw,
    fullName,
  });

  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`,
    );
    return { error: errors.join("; ") };
  }

  const input = parsed.data;

  try {
    const existing = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) {
      return { error: "A user with this email already exists." };
    }

    // Default password is the email prefix
    const defaultPassword = input.email.split("@")[0];
    const passwordHash = await hashPassword(defaultPassword);

    const securityAnswerHash = await hashPassword("phsi");

    const user = await db.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        role: "PARENT",
        fullName: input.fullName,
        phone: input.phone || null,
        securityQuestion: "What is the name of this institution?",
        securityAnswer: securityAnswerHash,
      },
    });

    await logAction(session.id, "CREATE", "Parent", user.id, {
      name: input.fullName,
    });

    revalidatePath("/parents");
    return {
      success: true,
      message: `Parent ${input.fullName} created. Default password is "${defaultPassword}".`,
    };
  } catch (error) {
    console.error("Create parent error:", error);
    return { error: "Failed to create parent." };
  }
}

export async function updateParentAction(
  id: string,
  _prevState: ParentActionState,
  formData: FormData,
): Promise<ParentActionState> {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")
  ) {
    return { error: "Unauthorized" };
  }

  const raw = Object.fromEntries(formData.entries());

  try {
    const user = await db.user.findUnique({ where: { id } });
    if (!user || user.role !== "PARENT") {
      return { error: "Parent not found." };
    }

    await db.user.update({
      where: { id },
      data: {
        fullName: (raw.fullName as string) || undefined,
        phone: (raw.phone as string) || null,
        isActive: raw.isActive === "true",
      },
    });

    await logAction(session.id, "UPDATE", "Parent", id, {
      name: raw.fullName,
    });

    revalidatePath(`/parents/${id}`);
    revalidatePath("/parents");
    return { success: true, message: "Parent updated successfully." };
  } catch (error) {
    console.error("Update parent error:", error);
    return { error: "Failed to update parent." };
  }
}

export async function deleteParentAction(
  id: string,
): Promise<ParentActionState> {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")
  ) {
    return { error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, fullName: true, role: true },
    });
    if (!user || user.role !== "PARENT") {
      return { error: "Parent not found." };
    }

    await db.user.delete({ where: { id } });

    await logAction(session.id, "DELETE", "Parent", id, {
      name: user.fullName,
    });

    revalidatePath("/parents");
    return { success: true, message: "Parent deleted." };
  } catch (error) {
    console.error("Delete parent error:", error);
    return { error: "Failed to delete parent." };
  }
}
