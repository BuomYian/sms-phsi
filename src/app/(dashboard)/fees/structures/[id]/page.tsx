import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { FeeStructureDetail } from "./fee-structure-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fs = await db.feeStructure.findUnique({
    where: { id },
    select: { category: true, program: { select: { code: true } } },
  });
  return {
    title: fs ? `${fs.program.code} — ${fs.category}` : "Fee Structure",
  };
}

export default async function FeeStructureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const feeStructure = await db.feeStructure.findUnique({
    where: { id },
    include: {
      program: { select: { name: true, code: true } },
      academicYear: { select: { name: true } },
      semester: { select: { name: true } },
      studentFees: {
        include: {
          student: {
            include: {
              user: { select: { fullName: true } },
            },
          },
        },
        orderBy: { student: { studentIdNumber: "asc" } },
      },
    },
  });

  if (!feeStructure) notFound();

  const serialized = {
    ...feeStructure,
    amount: Number(feeStructure.amount),
    studentFees: feeStructure.studentFees.map((sf) => ({
      ...sf,
      amountCharged: Number(sf.amountCharged),
      amountPaid: Number(sf.amountPaid),
      balance: Number(sf.balance),
    })),
  };

  return (
    <div className="space-y-6">
      <FeeStructureDetail feeStructure={serialized} />
    </div>
  );
}
