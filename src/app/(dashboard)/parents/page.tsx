import { db } from "@/lib/db";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Parents" };

export default async function ParentsPage() {
  const parents = await db.user.findMany({
    where: { role: "PARENT" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      _count: { select: { parentLinks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parents</h1>
          <p className="text-muted-foreground">
            Manage parent accounts and their student links.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/parents/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Parent
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={parents}
        searchKey="name"
        searchPlaceholder="Search parents..."
      />
    </div>
  );
}
