import { db } from "@/lib/db";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCog } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const staff = await db.staff.findMany({
    include: {
      department: { select: { name: true } },
      user: {
        select: { fullName: true, email: true, phone: true, isActive: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          <p className="text-muted-foreground">
            Manage staff members and instructors.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/staff/convert">
              <UserCog className="mr-2 h-4 w-4" />
              Convert User to Staff
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/staff/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff
            </Link>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={staff}
        searchKey="name"
        searchPlaceholder="Search staff..."
      />
    </div>
  );
}
