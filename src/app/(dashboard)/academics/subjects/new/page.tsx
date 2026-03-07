import { db } from "@/lib/db";
import SubjectForm from "./subject-form";

export const metadata = { title: "New Subject" };

export default async function NewSubjectPage() {
  const programs = await db.program.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Subject</h1>
        <p className="text-muted-foreground">Add a new subject / course.</p>
      </div>
      <SubjectForm programs={programs} />
    </div>
  );
}
