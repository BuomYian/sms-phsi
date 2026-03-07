import { db } from "@/lib/db";
import { StudentForm } from "./student-form";

export const metadata = { title: "Register New Student" };

export default async function NewStudentPage() {
  const programs = await db.program.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Register New Student
        </h1>
        <p className="text-muted-foreground">
          Fill in the details below to register a new student.
        </p>
      </div>
      <StudentForm programs={programs} />
    </div>
  );
}
