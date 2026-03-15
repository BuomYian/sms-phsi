import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Payment History" };

export default async function PaymentsPage() {
  const payments = await db.payment.findMany({
    include: {
      student: {
        include: { user: { select: { fullName: true } } },
      },
      recorder: { select: { fullName: true } },
    },
    orderBy: { paymentDate: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
        <p className="text-muted-foreground">All recorded student payments.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recorded By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">
                    {p.receiptNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{p.student.user.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.student.studentIdNumber}
                      </p>
                    </div>
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
                    {formatDateTime(p.paymentDate)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.recorder.fullName}
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No payments recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
