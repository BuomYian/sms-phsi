import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StudentEditForm } from "./student-edit-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await db.student.findUnique({
    where: { id },
    include: { user: { select: { fullName: true } } },
  });
  return {
    title: student ? `Edit ${student.user.fullName}` : "Edit Student",
  };
}

export default async function StudentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const student = await db.student.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
        },
      },
      program: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  if (!student) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Student</h1>
        <p className="text-muted-foreground">
          Update details for {student.user.fullName} ({student.studentIdNumber})
        </p>
      </div>
      <StudentEditForm student={student} />
    </div>
  );
}
