"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type CommActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function createAnnouncementAction(
  _prevState: CommActionState,
  formData: FormData,
): Promise<CommActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const targetAudience = formData.get("targetAudience") as string;
  const programId = (formData.get("programId") as string) || null;
  const publishDate = formData.get("publishDate") as string;
  const expiryDate = (formData.get("expiryDate") as string) || null;

  if (!title || !body || !targetAudience) {
    return { error: "Title, body, and target audience are required." };
  }

  try {
    const announcement = await db.announcement.create({
      data: {
        title,
        body,
        targetAudience,
        programId,
        createdBy: session.id,
        publishDate: publishDate ? new Date(publishDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    await logAction(session.id, "CREATE", "Announcement", announcement.id, {
      title,
      targetAudience,
    });

    revalidatePath("/announcements");
    return { success: true, message: "Announcement published." };
  } catch (error) {
    console.error("Create announcement error:", error);
    return { error: "Failed to create announcement." };
  }
}

export async function sendMessageAction(
  _prevState: CommActionState,
  formData: FormData,
): Promise<CommActionState> {
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

export async function markMessageReadAction(messageId: string) {
  const session = await getSession();
  if (!session) return;

  await db.message.update({
    where: { id: messageId, recipientId: session.id },
    data: { isRead: true },
  });

  revalidatePath("/messages");
}
