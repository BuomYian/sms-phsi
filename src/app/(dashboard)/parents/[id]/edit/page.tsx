import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ParentEditForm } from "./parent-edit-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id, role: "PARENT" },
    select: { fullName: true },
  });
  return {
    title: user ? `Edit ${user.fullName}` : "Edit Parent",
  };
}

export default async function ParentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const parent = await db.user.findUnique({
    where: { id, role: "PARENT" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      isActive: true,
    },
  });

  if (!parent) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Parent</h1>
        <p className="text-muted-foreground">
          Update parent account details for {parent.fullName}.
        </p>
      </div>
      <ParentEditForm parent={parent} />
    </div>
  );
}
