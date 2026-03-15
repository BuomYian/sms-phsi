"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  DollarSign,
  Users,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { deleteFeeStructureAction } from "../../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FeeStructureDetailProps {
  feeStructure: {
    id: string;
    category: string;
    amount: number;
    description: string | null;
    createdAt: Date;
    program: { name: string; code: string };
    academicYear: { name: string };
    semester: { name: string };
    studentFees: {
      id: string;
      amountCharged: number;
      amountPaid: number;
      balance: number;
      status: string;
      student: {
        id: string;
        studentIdNumber: string;
        user: { fullName: string };
      };
    }[];
  };
}

export function FeeStructureDetail({ feeStructure }: FeeStructureDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const hasStudentFees = feeStructure.studentFees.length > 0;

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteFeeStructureAction(feeStructure.id);
    if (result.success) {
      toast.success(result.message);
      router.push("/fees/structures");
    } else {
      toast.error(result.error);
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fees/structures">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {feeStructure.program.code} — {feeStructure.category}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {feeStructure.program.name} &middot;{" "}
              {feeStructure.academicYear.name} &middot;{" "}
              {feeStructure.semester.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/fees/structures/${feeStructure.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={hasStudentFees || deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Fee Structure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this fee structure. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(feeStructure.amount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Category</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-lg">
              {feeStructure.category}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Assigned Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feeStructure.studentFees.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {feeStructure.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{feeStructure.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Student fees table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Student Fees</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Charged</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeStructure.studentFees.map((sf) => (
                <TableRow key={sf.id}>
                  <TableCell className="font-mono">
                    {sf.student.studentIdNumber}
                  </TableCell>
                  <TableCell>{sf.student.user.fullName}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(sf.amountCharged)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {formatCurrency(sf.amountPaid)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    {formatCurrency(sf.balance)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        sf.status === "PAID"
                          ? "default"
                          : sf.status === "PARTIAL"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {sf.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {feeStructure.studentFees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No students assigned to this fee structure yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
