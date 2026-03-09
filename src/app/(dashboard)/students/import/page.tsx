"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { importStudentsAction } from "../actions";

type ParsedRow = {
  fullName: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
};

type Program = { id: string; name: string; code: string };

export default function StudentImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    message?: string;
    errors?: string[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((data) => setPrograms(data))
      .catch(() => toast.error("Failed to load programs."));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split("\n");
      if (lines.length < 2) {
        toast.error("CSV must have a header row and at least one data row.");
        return;
      }

      const parsed: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i]
          .split(",")
          .map((c) => c.trim().replace(/^"|"$/g, ""));
        if (cols.length >= 3) {
          parsed.push({
            fullName: cols[0] || "",
            email: cols[1] || "",
            gender: cols[2] || "",
            dateOfBirth: cols[3] || "",
            phone: cols[4] || "",
          });
        }
      }
      setRows(parsed);
      toast.success(`Parsed ${parsed.length} rows from CSV.`);
    };
    reader.readAsText(selectedFile);
  }

  function handleImport() {
    if (!selectedProgram) {
      toast.error("Please select a program first.");
      return;
    }

    startTransition(async () => {
      const res = await importStudentsAction(rows, selectedProgram);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message);
        setResult({ message: res.message, errors: res.errors });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Students</h1>
        <p className="text-muted-foreground">
          Upload a CSV file with student data (fullName, email, gender,
          dateOfBirth, phone).
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="programId">Assign to Program *</Label>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="csvFile">CSV File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Expected columns: fullName, email, gender, dateOfBirth, phone
          </p>
        </CardContent>
      </Card>

      {result && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {result.message}
            {result.errors && result.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-4 text-sm">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-destructive">
                    {err}
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preview ({rows.length} rows)</CardTitle>
              <Button
                onClick={handleImport}
                disabled={isPending || !selectedProgram}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import All
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{r.fullName}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.gender}</TableCell>
                    <TableCell>{r.dateOfBirth}</TableCell>
                    <TableCell>{r.phone}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
