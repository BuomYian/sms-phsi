"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { STATUS_COLORS } from "@/constants";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

export type StudentRow = {
  id: string;
  studentIdNumber: string;
  gender: string;
  status: string;
  admissionDate: Date;
  program: { name: string; code: string } | null;
  user: { fullName: string; email: string; phone: string | null };
};

export const columns: ColumnDef<StudentRow>[] = [
  {
    accessorKey: "studentIdNumber",
    header: "Student ID",
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {row.getValue("studentIdNumber")}
      </span>
    ),
  },
  {
    id: "name",
    header: "Name",
    accessorFn: (row) => row.user.fullName,
    cell: ({ row }) => {
      const fullName = row.original.user.fullName;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{fullName}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.user.email}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => (
      <span className="capitalize">
        {(row.getValue("gender") as string).toLowerCase()}
      </span>
    ),
  },
  {
    id: "program",
    header: "Program",
    accessorFn: (row) => row.program?.name ?? "—",
    cell: ({ row }) =>
      row.original.program ? (
        <div>
          <p className="text-sm">{row.original.program.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.program.code}
          </p>
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant="secondary" className={STATUS_COLORS[status] || ""}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const student = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/students/${student.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/students/${student.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
