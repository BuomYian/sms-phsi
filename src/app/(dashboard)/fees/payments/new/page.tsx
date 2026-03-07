import { db } from "@/lib/db";
import PaymentForm from "./payment-form";

export const metadata = { title: "Record Payment" };

export default async function NewPaymentPage() {
  const students = await db.student.findMany({
    where: { status: "ACTIVE" },
    include: { user: { select: { fullName: true } } },
    orderBy: { studentIdNumber: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Record Payment</h1>
        <p className="text-muted-foreground">
          Record a new student fee payment.
        </p>
      </div>
      <PaymentForm students={students} />
    </div>
  );
}
