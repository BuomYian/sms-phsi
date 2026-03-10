import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SubjectEditForm } from "./subject-edit-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subject = await db.subject.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: subject ? `Edit ${subject.name}` : "Edit Subject" };
}

export default async function SubjectEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [subject, programs] = await Promise.all([
    db.subject.findUnique({ where: { id } }),
    db.program.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!subject) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Subject</h1>
        <p className="text-muted-foreground">
          Update details for {subject.name} ({subject.code})
        </p>
      </div>
      <SubjectEditForm subject={subject} programs={programs} />
    </div>
  );
}
