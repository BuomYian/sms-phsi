import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import AcademicYearEditForm from "./academic-year-edit-form";

export const metadata = { title: "Edit Academic Year" };

export default async function EditAcademicYearPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([getSession(), params]);

  if (
    !session ||
    (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")
  ) {
    redirect("/academics/calendar");
  }

  const academicYear = await db.academicYear.findUnique({ where: { id } });
  if (!academicYear) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Academic Year
        </h1>
        <p className="text-muted-foreground">
          Update details for {academicYear.name}.
        </p>
      </div>
      <AcademicYearEditForm academicYear={academicYear} />
    </div>
  );
}
