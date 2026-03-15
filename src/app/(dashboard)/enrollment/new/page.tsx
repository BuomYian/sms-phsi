import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import EnrollmentForm from "./enrollment-form";

export const metadata = { title: "New Enrollment" };

export default async function NewEnrollmentPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";

  // Fetch active semesters with academic year info
  const semesters = await db.semester.findMany({
    include: { academicYear: { select: { name: true } } },
    orderBy: [{ academicYear: { startDate: "desc" } }, { startDate: "asc" }],
  });

  let students: {
    id: string;
    studentIdNumber: string;
    fullName: string;
    programId: string;
  }[] = [];
  let selfStudentId: string | null = null;

  if (isAdmin) {
    // Admins can enroll any active student
    const rawStudents = await db.student.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { fullName: true } },
        program: { select: { name: true } },
      },
      orderBy: { user: { fullName: "asc" } },
    });
    students = rawStudents.map((s) => ({
      id: s.id,
      studentIdNumber: s.studentIdNumber,
      fullName: s.user.fullName,
      programId: s.programId,
    }));
  } else if (session.role === "STUDENT") {
    // Students can only self-enroll
    const student = await db.student.findFirst({
      where: { userId: session.id },
      include: { user: { select: { fullName: true } } },
    });
    if (student) {
      selfStudentId = student.id;
      students = [
        {
          id: student.id,
          studentIdNumber: student.studentIdNumber,
          fullName: student.user.fullName,
          programId: student.programId,
        },
      ];
    }
  }

  // Fetch all subjects grouped by program
  const subjects = await db.subject.findMany({
    include: { program: { select: { name: true } } },
    orderBy: [
      { program: { name: "asc" } },
      { semesterNumber: "asc" },
      { name: "asc" },
    ],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Enrollment</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Enroll a student in a semester with selected subjects."
            : "Register for subjects in the upcoming semester."}
        </p>
      </div>
      <EnrollmentForm
        students={students}
        semesters={semesters.map((s) => ({
          id: s.id,
          name: s.name,
          academicYearName: s.academicYear.name,
          isCurrent: s.isCurrent,
        }))}
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          creditHours: s.creditHours,
          semesterNumber: s.semesterNumber,
          type: s.type,
          programId: s.programId,
          programName: s.program.name,
        }))}
        selfStudentId={selfStudentId}
      />
    </div>
  );
}
