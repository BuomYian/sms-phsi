import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import GradeEntryForm from "./grade-entry-form";

export const metadata = { title: "Grade Entry" };

export default async function GradeEntryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Get subjects that the current instructor teaches, or all subjects for admin
  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";

  const staff = isAdmin
    ? null
    : await db.staff.findFirst({
        where: { userId: session.id },
        select: { id: true },
      });

  const subjects = await db.subject.findMany({
    where: isAdmin
      ? {}
      : { instructors: { some: { staffId: staff?.id ?? "" } } },
    select: {
      id: true,
      code: true,
      name: true,
      courseEnrollments: {
        include: {
          enrollment: {
            include: {
              student: {
                include: { user: { select: { fullName: true } } },
              },
            },
          },
          grade: {
            select: {
              caMarks: true,
              examMarks: true,
              totalMarks: true,
              gradeLetter: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grade Entry</h1>
        <p className="text-muted-foreground">
          Enter CA and exam marks for enrolled students.
        </p>
      </div>
      <GradeEntryForm subjects={subjects} />
    </div>
  );
}
