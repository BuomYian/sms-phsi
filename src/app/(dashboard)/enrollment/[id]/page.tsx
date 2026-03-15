import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import EnrollmentDetail from "./enrollment-detail";

export const metadata = { title: "Enrollment Details" };

export default async function EnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([getSession(), params]);

  if (!session) notFound();

  const enrollment = await db.enrollment.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { fullName: true, email: true, avatarUrl: true } },
          program: { select: { name: true, code: true } },
        },
      },
      semester: {
        include: { academicYear: { select: { name: true } } },
      },
      approver: {
        select: { fullName: true },
      },
      courseEnrollments: {
        include: {
          subject: true,
          grade: {
            select: { totalMarks: true, gradeLetter: true, status: true },
          },
          _count: { select: { attendances: true } },
        },
        orderBy: { subject: { semesterNumber: "asc" } },
      },
    },
  });

  if (!enrollment) notFound();

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";

  return (
    <EnrollmentDetail
      enrollment={enrollment}
      isAdmin={isAdmin}
      sessionId={session.id}
    />
  );
}
