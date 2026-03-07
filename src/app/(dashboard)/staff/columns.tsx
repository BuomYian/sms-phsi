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
import { getInitials } from "@/lib/utils";
import Link from "next/link";

export type StaffRow = {
  id: string;
  staffIdNumber: string;
  designation: string;
  employmentType: string;
  user: {
    fullName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  };
  department: { name: string } | null;
};

export const columns: ColumnDef<StaffRow>[] = [
  {
    accessorKey: "staffIdNumber",
    header: "Staff ID",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.getValue("staffIdNumber")}</span>
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
    id: "department",
    header: "Department",
    accessorFn: (row) => row.department?.name ?? "—",
  },
  {
    accessorKey: "designation",
    header: "Designation",
    cell: ({ row }) => row.getValue("designation") || "—",
  },
  {
    accessorKey: "employmentType",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline">
        {(row.getValue("employmentType") as string).replace("_", " ")}
      </Badge>
    ),
  },
  {
    id: "isActive",
    header: "Status",
    accessorFn: (row) => row.user.isActive,
    cell: ({ row }) => (
      <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>
        {row.getValue("isActive") ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const staff = row.original;
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
              <Link href={`/staff/${staff.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/staff/${staff.id}/edit`}>
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
