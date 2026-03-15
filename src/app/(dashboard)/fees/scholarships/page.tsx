import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PlusCircle } from "lucide-react";

export const metadata = { title: "Scholarships" };

export default async function ScholarshipsPage() {
  const session = await getSession();
  const isAdmin =
    session?.role === "SUPER_ADMIN" ||
    session?.role === "ADMIN" ||
    session?.role === "FINANCE";

  const scholarships = await db.scholarship.findMany({
    include: {
      student: {
        include: { user: { select: { fullName: true } } },
      },
    },
    orderBy: { startDate: "desc" },
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scholarships</h1>
          <p className="text-muted-foreground">
            Student scholarships and financial aid.
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/fees/scholarships/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Scholarship
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sponsor</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">%</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scholarships.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{s.student.user.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.student.studentIdNumber}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.type}</Badge>
                  </TableCell>
                  <TableCell>{s.sponsor}</TableCell>
                  <TableCell className="text-right font-mono">
                    {s.amount ? formatCurrency(Number(s.amount)) : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.percentage ? `${s.percentage}%` : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(s.startDate)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(s.endDate)}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.endDate >= now ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Expired</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {scholarships.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No scholarships recorded.
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
