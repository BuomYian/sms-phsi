import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
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
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";

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
      parentLinks: {
        include: {
          parent: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
      },
      programSelections: {
        include: { requestedProgram: true },
        orderBy: { createdAt: "desc" as const },
        take: 1,
      },
    },
  });

  if (!student) notFound();

  // Parents can only view their linked children
  if (session?.role === "PARENT") {
    const isLinked = student.parentLinks.some(
      (pl) => pl.parent.id === session.id,
    );
    if (!isLinked) redirect("/dashboard");
  }

  // Fetch available parent users (only if admin)
  let availableParents: { id: string; fullName: string; email: string }[] = [];
  if (isAdmin) {
    const linkedParentIds = student.parentLinks.map((pl) => pl.parent.id);
    availableParents = await db.user.findMany({
      where: {
        role: "PARENT",
        isActive: true,
        id: { notIn: linkedParentIds },
      },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
    });
  }

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
    parentLinks: student.parentLinks.map((pl) => ({
      id: pl.id,
      parent: pl.parent,
    })),
    programSelections: student.programSelections,
  };

  return (
    <div className="space-y-6">
      <StudentDetail
        student={serialized}
        availableParents={availableParents}
        isAdmin={isAdmin}
        readOnly={!isAdmin}
        programSelections={serialized.programSelections}
      />
    </div>
  );
}
