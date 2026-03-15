import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import EnrollmentEditForm from "./enrollment-edit-form";

export const metadata = { title: "Edit Enrollment" };

export default async function EditEnrollmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([getSession(), params]);

  if (
    !session ||
    (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")
  ) {
    redirect("/enrollment");
  }

  const enrollment = await db.enrollment.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { fullName: true } },
          program: { select: { id: true, name: true } },
        },
      },
      semester: {
        include: { academicYear: { select: { name: true } } },
      },
      courseEnrollments: {
        select: { subjectId: true },
      },
    },
  });

  if (!enrollment) notFound();

  if (enrollment.status !== "PENDING" && enrollment.status !== "CONDITIONAL") {
    redirect(`/enrollment/${id}`);
  }

  // Fetch subjects for the student's program
  const subjects = await db.subject.findMany({
    where: { programId: enrollment.student.program.id },
    orderBy: [{ semesterNumber: "asc" }, { name: "asc" }],
  });

  const currentSubjectIds = enrollment.courseEnrollments.map(
    (ce) => ce.subjectId,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Enrollment Subjects
        </h1>
        <p className="text-muted-foreground">
          Modify subjects for {enrollment.student.user.fullName} —{" "}
          {enrollment.semester.academicYear.name}, {enrollment.semester.name}
        </p>
      </div>
      <EnrollmentEditForm
        enrollmentId={enrollment.id}
        studentName={enrollment.student.user.fullName}
        programName={enrollment.student.program.name}
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          creditHours: s.creditHours,
          semesterNumber: s.semesterNumber,
          type: s.type,
        }))}
        currentSubjectIds={currentSubjectIds}
      />
    </div>
  );
}
