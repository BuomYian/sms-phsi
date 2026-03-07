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
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Scholarships" };

export default async function ScholarshipsPage() {
  const scholarships = await db.scholarship.findMany({
    include: {
      student: {
        include: { user: { select: { fullName: true } } },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scholarships</h1>
        <p className="text-muted-foreground">
          Student scholarships and financial aid.
        </p>
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
                    {s.amount ? formatCurrency(Number(s.amount), "SSP") : "—"}
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
                </TableRow>
              ))}
              {scholarships.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
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
