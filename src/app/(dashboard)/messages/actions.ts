"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export type MessageActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function sendMessageAction(
  _prevState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const recipientId = formData.get("recipientId") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;

  if (!recipientId || !subject || !body) {
    return { error: "Recipient, subject, and body are required." };
  }

  try {
    await db.message.create({
      data: {
        senderId: session.id,
        recipientId,
        subject,
        body,
      },
    });

    revalidatePath("/messages");
    return { success: true, message: "Message sent." };
  } catch (error) {
    console.error("Send message error:", error);
    return { error: "Failed to send message." };
  }
}

export async function markMessageReadAction(
  messageId: string,
): Promise<MessageActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await db.message.update({
      where: { id: messageId, recipientId: session.id },
      data: { isRead: true },
    });

    revalidatePath("/messages");
    return { success: true };
  } catch (error) {
    console.error("Mark message read error:", error);
    return { error: "Failed to mark message as read." };
  }
}

export async function deleteMessageAction(
  id: string,
): Promise<MessageActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    // Only allow deleting messages you sent or received
    const msg = await db.message.findUnique({ where: { id } });
    if (!msg) return { error: "Message not found." };
    if (msg.senderId !== session.id && msg.recipientId !== session.id) {
      return { error: "You can only delete your own messages." };
    }

    await db.message.delete({ where: { id } });

    revalidatePath("/messages");
    return { success: true, message: "Message deleted." };
  } catch (error) {
    console.error("Delete message error:", error);
    return { error: "Failed to delete message." };
  }
}
