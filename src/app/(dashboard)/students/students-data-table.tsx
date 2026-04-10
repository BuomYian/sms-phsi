"use client";

import { DataTable } from "@/components/data-table";
import { getColumns, type StudentRow } from "./columns";

export function StudentsDataTable({
  data,
  isAdmin,
  searchPlaceholder,
  pageSize,
}: {
  data: StudentRow[];
  isAdmin: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
}) {
  return (
    <DataTable
      columns={getColumns(isAdmin)}
      data={data}
      searchKey="studentIdNumber"
      searchPlaceholder={searchPlaceholder ?? "Search students..."}
      pageSize={pageSize}
    />
  );
}
