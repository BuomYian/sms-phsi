import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProgramDetail } from "./program-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await db.program.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: program ? program.name : "Program" };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const program = await db.program.findUnique({
    where: { id },
    include: {
      department: { select: { name: true } },
      subjects: {
        orderBy: [{ semesterNumber: "asc" }, { name: "asc" }],
        include: {
          instructors: {
            include: {
              staff: {
                include: { user: { select: { fullName: true } } },
              },
            },
          },
        },
      },
      _count: { select: { students: true } },
    },
  });

  if (!program) notFound();

  return (
    <div className="space-y-6">
      <ProgramDetail program={program} />
    </div>
  );
}
