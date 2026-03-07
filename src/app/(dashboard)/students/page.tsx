import { db } from "@/lib/db";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { UserPlus, Upload } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Students" };

export default async function StudentsPage() {
  const students = await db.student.findMany({
    include: {
      program: { select: { name: true, code: true } },
      user: { select: { fullName: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage student records and admissions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/students/import">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/students/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Link>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={students}
        searchKey="studentIdNumber"
        searchPlaceholder="Search students..."
      />
    </div>
  );
}
