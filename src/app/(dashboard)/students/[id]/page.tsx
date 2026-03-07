import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StudentDetail } from "./student-detail";

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
    title: student ? student.user.fullName : "Student",
  };
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const student = await db.student.findUnique({
    where: { id },
    include: {
      program: {
        include: { department: true },
      },
      user: {
        select: {
          email: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
        },
      },
      enrollments: {
        include: {
          semester: { include: { academicYear: true } },
          courseEnrollments: {
            include: {
              subject: true,
              grade: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      studentFees: {
        include: {
          feeStructure: true,
        },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) notFound();

  return (
    <div className="space-y-6">
      <StudentDetail student={student} />
    </div>
  );
}
