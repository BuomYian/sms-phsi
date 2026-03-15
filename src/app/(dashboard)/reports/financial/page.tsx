import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Financial Report" };

export default async function FinancialReportPage() {
  const [billedAgg, paidAgg, paymentsCount, paymentsByMethod] =
    await Promise.all([
      db.studentFee.aggregate({ _sum: { amountCharged: true } }),
      db.studentFee.aggregate({ _sum: { amountPaid: true } }),
      db.payment.count(),
      db.payment.groupBy({
        by: ["paymentMethod"],
        _sum: { amount: true },
        _count: true,
      }),
    ]);

  const billed = Number(billedAgg._sum.amountCharged ?? 0);
  const paid = Number(paidAgg._sum.amountPaid ?? 0);
  const outstanding = billed - paid;
  const collectionRate = billed > 0 ? ((paid / billed) * 100).toFixed(1) : "0";

  const unpaidStudents = await db.studentFee.count({
    where: { balance: { gt: 0 } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Report</h1>
        <p className="text-muted-foreground">
          Revenue, collections, and financial health.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Billed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(billed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(paid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(outstanding)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collection Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{collectionRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsByMethod.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="space-y-3">
                {paymentsByMethod.map((pm) => (
                  <div
                    key={pm.paymentMethod}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {pm.paymentMethod.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pm._count} transactions
                      </p>
                    </div>
                    <p className="font-mono font-medium">
                      {formatCurrency(Number(pm._sum.amount ?? 0))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Payments</span>
                <span className="font-medium">{paymentsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Students with Balance
                </span>
                <span className="font-medium">{unpaidStudents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Payment</span>
                <span className="font-mono font-medium">
                  {paymentsCount > 0
                    ? formatCurrency(paid / paymentsCount)
                    : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
