import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await db.user.findMany({
    where: {
      staff: null,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json(users);
}
