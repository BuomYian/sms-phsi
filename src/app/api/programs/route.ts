import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const programs = await db.program.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(programs);
}
