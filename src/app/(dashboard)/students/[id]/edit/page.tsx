import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
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
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")
    redirect(`/students/${id}`);

  const [student, programs] = await Promise.all([
    db.student.findUnique({
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
    }),
    db.program.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!student) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Student</h1>
        <p className="text-muted-foreground">
          Update details for {student.user.fullName} ({student.studentIdNumber})
        </p>
      </div>
      <StudentEditForm student={student} programs={programs} />
    </div>
  );
}
