import { db } from "@/lib/db";
import { ConvertToStaffForm } from "./convert-form";

export const metadata = { title: "Convert User to Staff" };

export default async function ConvertToStaffPage() {
  const departments = await db.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Users who don't already have a Staff record
  const eligibleUsers = await db.user.findMany({
    where: { staff: null },
    select: { id: true, fullName: true, email: true, role: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Convert User to Staff
        </h1>
        <p className="text-muted-foreground">
          Select an existing user and assign them a staff role with a staff ID.
        </p>
      </div>
      <ConvertToStaffForm
        departments={departments}
        eligibleUsers={eligibleUsers}
      />
    </div>
  );
}
