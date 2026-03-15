import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { AnnouncementEditForm } from "./announcement-edit-form";

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
  return { title: a ? `Edit: ${a.title}` : "Edit Announcement" };
}

export default async function AnnouncementEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();
  if (
    !session ||
    (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")
  ) {
    redirect(`/announcements/${id}`);
  }

  const [announcement, programs] = await Promise.all([
    db.announcement.findUnique({ where: { id } }),
    db.program.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!announcement) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Announcement</h1>
        <p className="text-muted-foreground">Update announcement details.</p>
      </div>
      <AnnouncementEditForm announcement={announcement} programs={programs} />
    </div>
  );
}
