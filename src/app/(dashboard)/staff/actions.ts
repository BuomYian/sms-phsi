"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { createStaffSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { generateStaffId } from "@/lib/utils";

export type StaffActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function createStaffAction(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());

  const parsed = createStaffSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: `${firstError.path.join(".")}: ${firstError.message}` };
  }

  const input = parsed.data;

  try {
    const existingUser = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existingUser) {
      return { error: "A user with this email already exists." };
    }

    const staffCount = await db.staff.count();
    const staffIdNumber = generateStaffId(staffCount + 1);

    await db.$transaction(async (tx) => {
      const defaultPassword = `PHSI-STF-${new Date().getFullYear()}`;
      const passwordHash = await hashPassword(defaultPassword);

      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          role: input.role,
          fullName: input.fullName,
          phone: input.phone || null,
        },
      });

      await tx.staff.create({
        data: {
          userId: user.id,
          staffIdNumber,
          departmentId: input.departmentId,
          designation: input.designation,
          employmentType: input.employmentType || "FULL_TIME",
          dateOfHire: new Date(),
          salary: input.salary ?? null,
          qualifications: input.qualifications || null,
          gender: input.gender || null,
          dob: input.dob ? new Date(input.dob) : null,
          nationality: input.nationality || "South Sudanese",
          nationalId: input.nationalId || null,
          address: input.address || null,
        },
      });
    });

    await logAction(session.id, "CREATE", "Staff", staffIdNumber, {
      name: input.fullName,
    });

    revalidatePath("/staff");
    return {
      success: true,
      message: `Staff member ${input.fullName} created with ID: ${staffIdNumber}`,
    };
  } catch (error) {
    console.error("Create staff error:", error);
    return { error: "Failed to create staff member." };
  }
}

export async function deleteStaffAction(id: string): Promise<StaffActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    const staff = await db.staff.findUnique({
      where: { id },
      include: { user: { select: { fullName: true } } },
    });
    if (!staff) return { error: "Staff not found." };

    await db.$transaction(async (tx) => {
      await tx.staff.delete({ where: { id } });
      await tx.user.delete({ where: { id: staff.userId } });
    });

    await logAction(session.id, "DELETE", "Staff", id, {
      staffIdNumber: staff.staffIdNumber,
      name: staff.user.fullName,
    });

    revalidatePath("/staff");
    return { success: true, message: "Staff member deleted." };
  } catch (error) {
    console.error("Delete staff error:", error);
    return { error: "Failed to delete staff member." };
  }
}
