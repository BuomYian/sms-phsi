import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SubjectDetail } from "./subject-detail";

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

  const subject = await db.subject.findUnique({
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
  });

  if (!subject) notFound();

  return (
    <div className="space-y-6">
      <SubjectDetail subject={subject} />
    </div>
  );
}
