import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import ScholarshipForm from "./scholarship-form";

export const metadata = { title: "Create Scholarship" };

export default async function NewScholarshipPage() {
  const session = await getSession();
  if (!session) return null;

  const isAdmin =
    session.role === "SUPER_ADMIN" ||
    session.role === "ADMIN" ||
    session.role === "FINANCE";
  if (!isAdmin) redirect("/fees/scholarships");

  const students = await db.student.findMany({
    where: { status: "ACTIVE" },
    include: { user: { select: { fullName: true } } },
    orderBy: { studentIdNumber: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Create Scholarship
        </h1>
        <p className="text-muted-foreground">
          Assign a scholarship or financial aid to a student.
        </p>
      </div>
      <ScholarshipForm students={students} />
    </div>
  );
}
