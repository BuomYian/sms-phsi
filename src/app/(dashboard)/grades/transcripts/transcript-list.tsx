"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface StudentRow {
  id: string;
  studentIdNumber: string;
  fullName: string;
  program: string;
  gradedCount: number;
  cgpa: number;
}

interface Props {
  students: StudentRow[];
}

export function TranscriptList({ students }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const allSelected = students.length > 0 && selected.size === students.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(students.map((s) => s.id)));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const downloadSelected = useCallback(async () => {
    const ids = [...selected];
    if (ids.length === 0) return;

    setDownloading(true);
    const toastId = toast.loading(`Downloading 0 / ${ids.length}…`);

    let done = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const res = await fetch(`/api/transcripts/${id}`);
        if (!res.ok) throw new Error();

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          res.headers.get("Content-Disposition")
            ?.split("filename=")[1]
            ?.replace(/"/g, "") ?? `transcript_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        done++;
        toast.loading(`Downloading ${done} / ${ids.length}…`, { id: toastId });

        // Small gap between downloads so the browser doesn't block them
        if (done < ids.length) await new Promise((r) => setTimeout(r, 400));
      } catch {
        failed++;
      }
    }

    setDownloading(false);
    if (failed === 0) {
      toast.success(`Downloaded ${done} transcript${done !== 1 ? "s" : ""}`, { id: toastId });
    } else {
      toast.warning(`Downloaded ${done}, failed ${failed}`, { id: toastId });
    }
  }, [selected]);

  return (
    <div className="space-y-3">
      {/* Bulk actions bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selected.size > 0
            ? `${selected.size} student${selected.size !== 1 ? "s" : ""} selected`
            : `${students.length} student${students.length !== 1 ? "s" : ""}`}
        </p>
        <Button
          size="sm"
          disabled={selected.size === 0 || downloading}
          onClick={downloadSelected}
        >
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download Selected ({selected.size})
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Program</TableHead>
              <TableHead className="text-center">Courses</TableHead>
              <TableHead className="text-center">CGPA</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow
                key={s.id}
                data-state={selected.has(s.id) ? "selected" : undefined}
                className="cursor-pointer"
                onClick={() => toggle(s.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(s.id)}
                    onCheckedChange={() => toggle(s.id)}
                    aria-label={`Select ${s.fullName}`}
                  />
                </TableCell>
                <TableCell className="font-mono">{s.studentIdNumber}</TableCell>
                <TableCell className="font-medium">{s.fullName}</TableCell>
                <TableCell>{s.program}</TableCell>
                <TableCell className="text-center">{s.gradedCount}</TableCell>
                <TableCell className="text-center">
                  {s.cgpa > 0 ? (
                    <Badge variant="outline">{s.cgpa.toFixed(2)}</Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/grades/transcripts/${s.id}`}>
                      <FileText className="mr-1 h-3.5 w-3.5" />
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
