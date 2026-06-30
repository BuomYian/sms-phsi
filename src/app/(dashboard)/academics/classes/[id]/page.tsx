import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ClassDetail } from "./class-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cls = await db.academicClass.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: cls?.name ?? "Class Detail" };
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const cls = await db.academicClass.findUnique({
    where: { id },
    include: {
      program: {
        select: { id: true, name: true, code: true, durationSemesters: true },
      },
      academicYear: {
        select: {
          id: true,
          name: true,
          semesters: {
            select: { id: true, name: true },
            orderBy: { startDate: "asc" },
          },
        },
      },
      students: {
        include: {
          student: {
            include: {
              user: { select: { fullName: true, email: true } },
            },
          },
        },
        orderBy: { student: { user: { fullName: "asc" } } },
      },
    },
  });

  if (!cls) notFound();

  // Programme semesters for this year level
  const semStart = (cls.yearLevel - 1) * 2 + 1;
  const semEnd = cls.yearLevel * 2;

  // Active and completed offerings for this class
  const offerings = await db.subjectOffering.findMany({
    where: { classId: id },
    include: {
      subject: {
        include: {
          instructors: {
            where: { academicYearId: cls.academicYear.id },
            include: {
              staff: { include: { user: { select: { fullName: true } } } },
              semester: { select: { name: true } },
            },
          },
        },
      },
      semester: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { subject: { semesterNumber: "asc" } }, { subject: { name: "asc" } }],
  });

  // All programme subjects for this year level that haven't been offered yet
  const offeredSubjectIds = new Set(offerings.map((o) => o.subjectId));
  const availableSubjects = await db.subject.findMany({
    where: {
      programId: cls.program.id,
      semesterNumber: { gte: semStart, lte: semEnd },
      id: { notIn: offeredSubjectIds.size > 0 ? Array.from(offeredSubjectIds) : undefined },
    },
    orderBy: [{ semesterNumber: "asc" }, { name: "asc" }],
  });

  // Get available students (same program, active, not already in this class)
  const existingStudentIds = cls.students.map((cs) => cs.studentId);
  const availableStudents = await db.student.findMany({
    where: {
      programId: cls.program.id,
      status: "ACTIVE",
      id: {
        notIn: existingStudentIds.length > 0 ? existingStudentIds : undefined,
      },
    },
    include: {
      user: { select: { fullName: true } },
    },
    orderBy: { user: { fullName: "asc" } },
  });

  const maxYears = Math.ceil(cls.program.durationSemesters / 2);
  const isLastYear = cls.yearLevel >= maxYears;

  return (
    <ClassDetail
      cls={{
        id: cls.id,
        name: cls.name,
        yearLevel: cls.yearLevel,
        programName: cls.program.name,
        programCode: cls.program.code,
        academicYearName: cls.academicYear.name,
        isLastYear,
      }}
      students={cls.students.map((cs) => ({
        classStudentId: cs.id,
        studentId: cs.student.id,
        studentIdNumber: cs.student.studentIdNumber,
        fullName: cs.student.user.fullName,
        email: cs.student.user.email,
        status: cs.status,
      }))}
      offerings={offerings.map((o) => ({
        id: o.id,
        status: o.status,
        semesterId: o.semester.id,
        semesterName: o.semester.name,
        subject: {
          id: o.subject.id,
          name: o.subject.name,
          code: o.subject.code,
          creditHours: o.subject.creditHours,
          semesterNumber: o.subject.semesterNumber,
          type: o.subject.type,
          instructors: o.subject.instructors.map((si) => ({
            name: si.staff.user.fullName,
            semester: si.semester.name,
          })),
        },
      }))}
      availableSubjects={availableSubjects.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        creditHours: s.creditHours,
        semesterNumber: s.semesterNumber,
      }))}
      calendarSemesters={cls.academicYear.semesters.map((s) => ({
        id: s.id,
        name: s.name,
      }))}
      availableStudents={availableStudents.map((s) => ({
        id: s.id,
        studentIdNumber: s.studentIdNumber,
        fullName: s.user.fullName,
      }))}
    />
  );
}
