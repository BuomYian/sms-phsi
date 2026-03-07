import { db } from "@/lib/db";
import AnnouncementForm from "./announcement-form";

export const metadata = { title: "New Announcement" };

export default async function NewAnnouncementPage() {
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
