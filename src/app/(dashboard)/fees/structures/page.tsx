import { db } from "@/lib/db";
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

export const metadata = { title: "Fee Structures" };

export default async function FeeStructuresPage() {
  const structures = await db.feeStructure.findMany({
    include: {
      program: { select: { name: true, code: true } },
      academicYear: { select: { name: true } },
      semester: { select: { name: true } },
    },
    orderBy: [{ academicYear: { startDate: "desc" } }, { category: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fee Structures</h1>
        <p className="text-muted-foreground">
          Fee categories and amounts per program and semester.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Currency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {structures.map((fs) => (
                <TableRow key={fs.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{fs.program.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fs.program.code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{fs.academicYear.name}</TableCell>
                  <TableCell>{fs.semester.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{fs.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(Number(fs.amount), fs.currency)}
                  </TableCell>
                  <TableCell>{fs.currency}</TableCell>
                </TableRow>
              ))}
              {structures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No fee structures defined.
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
