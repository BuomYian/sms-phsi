import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AcademicYearForm from "./academic-year-form";

export const metadata = { title: "New Academic Year" };

export default async function NewAcademicYearPage() {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")
  ) {
    redirect("/academics/calendar");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Academic Year</h1>
        <p className="text-muted-foreground">
          Create a new academic year with its date range.
        </p>
      </div>
      <AcademicYearForm />
    </div>
  );
}
