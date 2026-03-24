"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit";

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

export async function broadcastMessageAction(
  _prevState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    return { error: "Only administrators can send broadcast messages." };
  }

  const targetRole = formData.get("targetRole") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;

  if (!targetRole || !subject || !body) {
    return { error: "Target role, subject, and body are required." };
  }

  try {
    const recipients = await db.user.findMany({
      where: {
        isActive: true,
        id: { not: session.id },
        ...(targetRole !== "ALL" ? { role: targetRole as never } : {}),
      },
      select: { id: true },
    });

    if (recipients.length === 0) {
      return { error: "No recipients found for the selected role." };
    }

    await db.message.createMany({
      data: recipients.map((r) => ({
        senderId: session.id,
        recipientId: r.id,
        subject,
        body,
      })),
    });

    await logAction(session.id, "CREATE", "Message", "broadcast", {
      targetRole,
      recipientCount: recipients.length,
    });

    revalidatePath("/messages");
    return {
      success: true,
      message: `Broadcast sent to ${recipients.length} recipient(s).`,
    };
  } catch (error) {
    console.error("Broadcast message error:", error);
    return { error: "Failed to send broadcast message." };
  }
}
