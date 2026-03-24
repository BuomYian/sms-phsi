import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { AnnouncementDetail } from "./announcement-detail";
import { trackAnnouncementReadAction } from "../actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await db.announcement.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: a ? a.title : "Announcement" };
}

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  const announcement = await db.announcement.findUnique({
    where: { id },
    include: {
      author: { select: { fullName: true } },
      program: { select: { name: true } },
      reads: { select: { id: true } },
    },
  });

  if (!announcement) notFound();

  // Track this read
  if (session) {
    await trackAnnouncementReadAction(id);
  }

  return (
    <div className="space-y-6">
      <AnnouncementDetail
        announcement={announcement}
        isAdmin={isAdmin}
        readCount={announcement.reads.length}
      />
    </div>
  );
}
