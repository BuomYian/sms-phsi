import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
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
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Award } from "lucide-react";

export const metadata = { title: "Student Accounts" };

export default async function StudentAccountsPage() {
  const session = await getSession();
  const isAdmin =
    session?.role === "SUPER_ADMIN" ||
    session?.role === "ADMIN" ||
    session?.role === "FINANCE";

  const now = new Date();
  const students = await db.student.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { fullName: true } },
      program: { select: { name: true } },
      studentFees: true,
      scholarships: {
        where: { startDate: { lte: now }, endDate: { gte: now } },
        select: { sponsor: true, percentage: true, amount: true, type: true },
        take: 1,
      },
    },
    orderBy: { studentIdNumber: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Student Accounts
          </h1>
          <p className="text-muted-foreground">
            Fee balances for all active students.
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/fees/accounts/assign">
              <PlusCircle className="mr-2 h-4 w-4" />
              Assign Fee
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Sponsor</TableHead>
                <TableHead className="text-right">Billed</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const billed = s.studentFees.reduce(
                  (sum: number, f: { amountCharged: unknown }) =>
                    sum + Number(f.amountCharged),
                  0,
                );
                const paid = s.studentFees.reduce(
                  (sum: number, f: { amountPaid: unknown }) =>
                    sum + Number(f.amountPaid),
                  0,
                );
                const balance = s.studentFees.reduce(
                  (sum: number, f: { balance: unknown }) =>
                    sum + Number(f.balance),
                  0,
                );
                const scholarship = s.scholarships[0];
                const statusLabel =
                  balance <= 0
                    ? "PAID"
                    : paid > 0
                      ? "PARTIAL"
                      : billed > 0
                        ? "UNPAID"
                        : "NO FEES";

                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">
                      {s.studentIdNumber}
                    </TableCell>
                    <TableCell>{s.user.fullName}</TableCell>
                    <TableCell>{s.program.name}</TableCell>
                    <TableCell>
                      {scholarship ? (
                        <div className="flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                              {scholarship.sponsor}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {scholarship.percentage
                                ? `${scholarship.percentage}%`
                                : scholarship.amount
                                  ? `$${Number(scholarship.amount).toFixed(0)}`
                                  : scholarship.type}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Self-funded
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(billed)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {formatCurrency(paid)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      {formatCurrency(balance)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          statusLabel === "PAID"
                            ? "default"
                            : statusLabel === "PARTIAL"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/students/${s.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No active students.
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
