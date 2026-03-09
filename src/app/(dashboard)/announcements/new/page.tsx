import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import AnnouncementForm from "./announcement-form";

export const metadata = { title: "New Announcement" };

export default async function NewAnnouncementPage() {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")
  ) {
    redirect("/announcements");
  }
  const programs = await db.program.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Announcement</h1>
        <p className="text-muted-foreground">
          Create and publish an announcement.
        </p>
      </div>
      <AnnouncementForm programs={programs} />
    </div>
  );
}
