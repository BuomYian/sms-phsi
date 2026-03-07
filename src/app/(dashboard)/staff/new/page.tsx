import { db } from "@/lib/db";
import { StaffForm } from "./staff-form";

export const metadata = { title: "Add New Staff" };

export default async function NewStaffPage() {
  const departments = await db.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New Staff</h1>
        <p className="text-muted-foreground">
          Fill in the details below to add a new staff member.
        </p>
      </div>
      <StaffForm departments={departments} />
    </div>
  );
}
