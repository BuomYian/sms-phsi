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
import { formatCurrency } from "@/lib/utils";
import { PlusCircle, Eye } from "lucide-react";

export const metadata = { title: "Fee Structures" };

export default async function FeeStructuresPage() {
  const session = await getSession();
  const isAdmin =
    session?.role === "SUPER_ADMIN" ||
    session?.role === "ADMIN" ||
    session?.role === "FINANCE";

  const structures = await db.feeStructure.findMany({
    include: {
      program: { select: { name: true, code: true } },
      academicYear: { select: { name: true } },
      semester: { select: { name: true } },
      _count: { select: { studentFees: true } },
    },
    orderBy: [{ academicYear: { startDate: "desc" } }, { category: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Structures</h1>
          <p className="text-muted-foreground">
            Fee categories and amounts per program and semester.
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/fees/structures/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Fee Structure
            </Link>
          </Button>
        )}
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
                <TableHead className="text-center">Assigned</TableHead>
                <TableHead className="text-right">Action</TableHead>
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
                    {formatCurrency(Number(fs.amount))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{fs._count.studentFees}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/fees/structures/${fs.id}`}>
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {structures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
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
