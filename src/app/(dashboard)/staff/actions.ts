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

  // Map form field names to schema field names
  const firstName = ((raw.firstName as string) || "").trim();
  const middleName = ((raw.middleName as string) || "").trim();
  const lastName = ((raw.lastName as string) || "").trim();
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  const data = {
    ...raw,
    fullName,
    dob: raw.dateOfBirth || raw.dob,
    designation: raw.position || raw.designation || "Staff",
    qualifications: raw.qualification || raw.qualifications,
  };

  const parsed = createStaffSchema.safeParse(data);
  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`,
    );
    console.error("Staff validation errors:", errors);
    return { error: errors.join("; ") };
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
      const passwordHash = await hashPassword(staffIdNumber);

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
      message: `Staff member ${input.fullName} created. ID: ${staffIdNumber} (this is also their login password).`,
    };
  } catch (error) {
    console.error("Create staff error:", error);
    return { error: "Failed to create staff member." };
  }
}

export async function updateStaffAction(
  id: string,
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());

  try {
    const result = await db.$transaction(async (tx) => {
      const staff = await tx.staff.findUnique({
        where: { id },
        select: { userId: true, staffIdNumber: true },
      });
      if (!staff) return null;

      await tx.staff.update({
        where: { id },
        data: {
          departmentId: (raw.departmentId as string) || undefined,
          designation: (raw.designation as string) || undefined,
          employmentType: (raw.employmentType as string) || undefined,
          salary: raw.salary ? parseFloat(raw.salary as string) : undefined,
          qualifications: (raw.qualifications as string) || undefined,
          gender: (raw.gender as string) || undefined,
          dob: raw.dob ? new Date(raw.dob as string) : undefined,
          nationality: (raw.nationality as string) || undefined,
          nationalId: (raw.nationalId as string) || undefined,
          address: (raw.address as string) || undefined,
        },
      });

      const fullName = raw.fullName as string | undefined;
      const phone = raw.phone as string | undefined;
      const role = raw.role as string | undefined;
      if (fullName || phone || role) {
        await tx.user.update({
          where: { id: staff.userId },
          data: {
            ...(fullName ? { fullName } : {}),
            ...(phone ? { phone } : {}),
            ...(role ? { role } : {}),
          },
        });
      }

      return staff;
    });

    if (!result) return { error: "Staff not found." };

    await logAction(session.id, "UPDATE", "Staff", id, {
      staffIdNumber: result.staffIdNumber,
    });

    revalidatePath(`/staff/${id}`);
    revalidatePath("/staff");

    return { success: true, message: "Staff member updated successfully." };
  } catch (error) {
    console.error("Update staff error:", error);
    return { error: "Failed to update staff member." };
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

export async function convertToStaffAction(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const userId = (formData.get("userId") as string)?.trim();
  const departmentId = (formData.get("departmentId") as string)?.trim() || null;
  const designation =
    (formData.get("designation") as string)?.trim() || "Staff";
  const employmentType =
    (formData.get("employmentType") as string)?.trim() || "FULL_TIME";
  const qualifications =
    (formData.get("qualifications") as string)?.trim() || null;
  const newRole = (formData.get("role") as string)?.trim() || null;

  if (!userId) return { error: "Please select a user." };

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found." };

    const existingStaff = await db.staff.findUnique({ where: { userId } });
    if (existingStaff) {
      return {
        error: `This user already has a staff record (${existingStaff.staffIdNumber}).`,
      };
    }

    const staffCount = await db.staff.count();
    const staffIdNumber = generateStaffId(staffCount + 1);

    await db.$transaction(async (tx) => {
      await tx.staff.create({
        data: {
          userId,
          staffIdNumber,
          departmentId: departmentId || null,
          designation,
          employmentType: employmentType as
            | "FULL_TIME"
            | "PART_TIME"
            | "CONTRACT",
          dateOfHire: new Date(),
          qualifications,
        },
      });

      // Update user role if requested
      if (newRole && newRole !== user.role) {
        await tx.user.update({
          where: { id: userId },
          data: { role: newRole as "ADMIN" | "INSTRUCTOR" | "FINANCE" },
        });
      }
    });

    await logAction(session.id, "CREATE", "Staff", staffIdNumber, {
      name: user.fullName,
      convertedFrom: user.role,
    });

    revalidatePath("/staff");
    return {
      success: true,
      message: `${user.fullName} is now a staff member with ID: ${staffIdNumber}`,
    };
  } catch (error) {
    console.error("Convert to staff error:", error);
    return { error: "Failed to convert user to staff member." };
  }
}
