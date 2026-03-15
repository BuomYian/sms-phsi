import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import AcademicYearDetail from "./academic-year-detail";

export const metadata = { title: "Academic Year Details" };

export default async function AcademicYearPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const academicYear = await db.academicYear.findUnique({
    where: { id },
    include: {
      semesters: {
        orderBy: { startDate: "asc" },
        include: {
          _count: {
            select: {
              enrollments: true,
              timetableEntries: true,
              examSchedules: true,
            },
          },
        },
      },
    },
  });

  if (!academicYear) notFound();

  return <AcademicYearDetail academicYear={academicYear} />;
}
