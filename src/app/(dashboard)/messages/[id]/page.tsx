import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { MessageDetail } from "./message-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const msg = await db.message.findUnique({
    where: { id },
    select: { subject: true },
  });
  return { title: msg ? msg.subject : "Message" };
}

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const message = await db.message.findUnique({
    where: { id },
    include: {
      sender: { select: { id: true, fullName: true, email: true } },
      recipient: { select: { id: true, fullName: true, email: true } },
    },
  });

  if (!message) notFound();

  // Only sender or recipient can view
  if (message.senderId !== session.id && message.recipientId !== session.id) {
    redirect("/messages");
  }

  // Mark as read if the current user is the recipient and it's unread
  if (message.recipientId === session.id && !message.isRead) {
    await db.message.update({
      where: { id },
      data: { isRead: true },
    });
  }

  const isSender = message.senderId === session.id;

  return (
    <div className="space-y-6">
      <MessageDetail message={message} isSender={isSender} />
    </div>
  );
}
