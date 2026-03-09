import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StudentDetail } from "./student-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await db.student.findUnique({
    where: { id },
    include: { user: { select: { fullName: true } } },
  });
  return {
    title: student ? student.user.fullName : "Student",
  };
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const student = await db.student.findUnique({
    where: { id },
    include: {
      program: {
        include: { department: true },
      },
      user: {
        select: {
          email: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
        },
      },
      enrollments: {
        include: {
          semester: { include: { academicYear: true } },
          courseEnrollments: {
            include: {
              subject: true,
              grade: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      studentFees: {
        include: {
          feeStructure: true,
        },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) notFound();

  // Serialize Decimal fields to numbers for client component
  const serialized = {
    ...student,
    studentFees: student.studentFees.map((fee) => ({
      ...fee,
      amountCharged: Number(fee.amountCharged),
      amountPaid: Number(fee.amountPaid),
      balance: Number(fee.balance),
      feeStructure: {
        ...fee.feeStructure,
        amount: Number(fee.feeStructure.amount),
      },
    })),
    payments: student.payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })),
  };

  return (
    <div className="space-y-6">
      <StudentDetail student={serialized} />
    </div>
  );
}
