import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SubjectDetail } from "./subject-detail";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subject = await db.subject.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: subject ? subject.name : "Subject" };
}

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const [subject, semesters] = await Promise.all([
    db.subject.findUnique({
      where: { id },
      include: {
        program: {
          select: { id: true, name: true, code: true },
        },
        instructors: {
          include: {
            staff: {
              include: {
                user: { select: { fullName: true, email: true } },
              },
            },
            academicYear: { select: { name: true } },
            semester: { select: { name: true } },
          },
        },
        prerequisites: {
          include: {
            prerequisite: { select: { name: true, code: true } },
          },
        },
        prerequisiteOf: {
          include: {
            subject: { select: { name: true, code: true } },
          },
        },
        _count: { select: { courseEnrollments: true } },
      },
    }),
    db.semester.findMany({
      include: { academicYear: { select: { id: true, name: true } } },
      orderBy: [{ academicYear: { startDate: "desc" } }, { startDate: "asc" }],
    }),
  ]);

  if (!subject) notFound();

  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <SubjectDetail
        subject={subject}
        semesters={semesters}
        isAdmin={isAdmin}
      />
    </div>
  );
}
