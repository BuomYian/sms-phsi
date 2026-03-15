import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

  const maxMethodAmount = Math.max(
    ...paymentsByMethod.map((pm) => Number(pm._sum.amount ?? 0)),
    1,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Financial Report
          </h1>
          <p className="text-muted-foreground">
            Revenue, collections, and financial health.
          </p>
        </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Collection Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
              <div
                className={`h-full rounded ${Number(collectionRate) >= 75 ? "bg-green-500" : Number(collectionRate) >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${collectionRate}%` }}
              />
            </div>
            <span className="text-2xl font-bold min-w-20 text-right">
              {collectionRate}%
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatCurrency(paid)} collected out of {formatCurrency(billed)}{" "}
            billed.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsByMethod.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="space-y-4">
                {paymentsByMethod.map((pm) => {
                  const amt = Number(pm._sum.amount ?? 0);
                  const pct = (amt / maxMethodAmount) * 100;
                  return (
                    <div key={pm.paymentMethod} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {pm.paymentMethod.replaceAll("_", " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pm._count} transactions
                          </p>
                        </div>
                        <p className="font-mono font-medium">
                          {formatCurrency(amt)}
                        </p>
                      </div>
                      <div className="h-3 bg-muted rounded overflow-hidden">
                        <div
                          className="h-full bg-green-500/70 rounded"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
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
