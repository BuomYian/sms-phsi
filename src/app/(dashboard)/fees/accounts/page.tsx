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
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "Student Accounts" };

export default async function StudentAccountsPage() {
  const students = await db.student.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { fullName: true } },
      program: { select: { name: true } },
      studentFees: true,
    },
    orderBy: { studentIdNumber: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Accounts</h1>
        <p className="text-muted-foreground">
          Fee balances for all active students.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Program</TableHead>
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
                const balance = billed - paid;
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
                    <TableCell className="text-right font-mono">
                      {formatCurrency(billed, "SSP")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {formatCurrency(paid, "SSP")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      {formatCurrency(balance, "SSP")}
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
                  <TableCell colSpan={8} className="h-24 text-center">
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
