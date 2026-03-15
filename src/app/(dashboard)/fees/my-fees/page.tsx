import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Award } from "lucide-react";

export const metadata = { title: "My Fees" };

export default async function MyFeesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const student = await db.student.findFirst({
    where: { userId: session.id },
    include: {
      scholarships: {
        where: { startDate: { lte: now }, endDate: { gte: now } },
        select: {
          sponsor: true,
          type: true,
          percentage: true,
          amount: true,
          startDate: true,
          endDate: true,
        },
      },
      studentFees: {
        include: {
          feeStructure: {
            include: {
              semester: { select: { name: true } },
              academicYear: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });

  if (!student) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No student profile linked to your account.
        </CardContent>
      </Card>
    );
  }

  const totalBilled = student.studentFees.reduce(
    (s: number, f: { amountCharged: unknown }) => s + Number(f.amountCharged),
    0,
  );
  const totalPaid = student.studentFees.reduce(
    (s: number, f: { amountPaid: unknown }) => s + Number(f.amountPaid),
    0,
  );
  const balance = totalBilled - totalPaid;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Fees</h1>
        <p className="text-muted-foreground">
          Your fee summary and payment history.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Billed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalBilled)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {student.scholarships.length > 0 && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Award className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base text-green-700 dark:text-green-400">
              Active Scholarship
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.scholarships.map((sch, i) => (
              <div key={i} className="space-y-1">
                <p className="font-medium">Sponsored by: {sch.sponsor}</p>
                <p className="text-sm text-muted-foreground">
                  {sch.type}
                  {sch.percentage ? ` · ${sch.percentage}% coverage` : ""}
                  {sch.amount
                    ? ` · $${Number(sch.amount).toFixed(2)} fixed`
                    : ""}
                </p>
                {sch.percentage === 100 && (
                  <Badge
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 mt-1"
                  >
                    Full Scholarship — No Fees Required
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fee Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Charged</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {student.studentFees.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="text-sm">
                    {f.feeStructure.academicYear.name} —{" "}
                    {f.feeStructure.semester.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{f.feeStructure.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(Number(f.amountCharged))}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {formatCurrency(Number(f.amountPaid))}
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    {formatCurrency(Number(f.balance))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={f.status === "PAID" ? "default" : "secondary"}
                    >
                      {f.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {student.studentFees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No fees assigned.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {student.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">
                      {p.receiptNumber}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(Number(p.amount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.referenceNumber || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.paymentDate.toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
