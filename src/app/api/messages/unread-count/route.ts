import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ count: 0 }, { status: 401 });
  }

  const count = await db.message.count({
    where: { recipientId: session.id, isRead: false },
  });

  return NextResponse.json({ count });
}
