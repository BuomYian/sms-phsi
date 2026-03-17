import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ParentDetail } from "./parent-detail";

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
    title: user ? user.fullName : "Parent",
  };
}

export default async function ParentDetailPage({
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
      createdAt: true,
      parentLinks: {
        include: {
          student: {
            include: {
              user: { select: { fullName: true } },
              program: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!parent) notFound();

  return (
    <div className="space-y-6">
      <ParentDetail parent={parent} />
    </div>
  );
}
