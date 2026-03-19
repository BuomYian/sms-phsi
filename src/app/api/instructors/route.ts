import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const staff = await db.staff.findMany({
    where: {
      user: { role: "INSTRUCTOR", isActive: true },
    },
    select: {
      id: true,
      staffIdNumber: true,
      user: { select: { fullName: true, email: true } },
    },
    orderBy: { user: { fullName: "asc" } },
  });
  return NextResponse.json(staff);
}
