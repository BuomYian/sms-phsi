import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import SelectionDetail from "./selection-detail";

export const metadata = { title: "Review Programme Selection" };

export default async function ProgramSelectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const selection = await db.programSelection.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: true,
          program: true,
        },
      },
      requestedProgram: true,
      reviewer: true,
    },
  });

  if (!selection) notFound();

  return <SelectionDetail selection={selection} />;
}
