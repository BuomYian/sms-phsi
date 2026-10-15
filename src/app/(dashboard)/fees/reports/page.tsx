import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { summariseFeeAggregate } from "@/lib/fees";

export const metadata = { title: "Fee Reports" };

export default async function FeeReportsPage() {
  const [feeAgg, cashAgg, paymentsCount, studentsWithBalance] =
    await Promise.all([
      db.studentFee.aggregate({
        _sum: { amountCharged: true, amountPaid: true, balance: true },
      }),
      db.payment.aggregate({ _sum: { amount: true } }),
      db.payment.count(),
      // Count STUDENTS, not fee rows — this figure is labelled "Students with
      // Balance" and is the divisor for the average.
      db.student.count({
        where: { studentFees: { some: { balance: { gt: 0 } } } },
      }),
    ]);

  const summary = summariseFeeAggregate(feeAgg._sum);
  const { billed, paid, waived, outstanding, netBilled } = summary;
  const collectionRate = summary.collectionRate.toFixed(1);
  // Cash banked that could not be allocated to any fee — normal for a fully
  // sponsored student, whose fees all have a zero balance.
  const unallocated = Number(cashAgg._sum.amount ?? 0) - paid;

  // Payment method breakdown
  const paymentsByMethod = await db.payment.groupBy({
    by: ["paymentMethod"],
    _sum: { amount: true },
    _count: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fee Reports</h1>
        <p className="text-muted-foreground">
          Financial summaries and collection analytics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
              Sponsored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(waived)}
            </p>
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
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(netBilled)} collectible
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsByMethod.length === 0 ? (
              <p className="text-muted-foreground text-sm">No payments yet.</p>
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
                        {pm._count} payments
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
            <CardTitle>Summary</CardTitle>
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
                <span className="font-medium">{studentsWithBalance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. Outstanding</span>
                <span className="font-mono font-medium">
                  {studentsWithBalance > 0
                    ? formatCurrency(outstanding / studentsWithBalance)
                    : "—"}
                </span>
              </div>
              {unallocated !== 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Unallocated payments
                  </span>
                  <span className="font-mono font-medium text-amber-600">
                    {formatCurrency(unallocated)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
