import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search } from "lucide-react";
import { TranscriptList, type StudentRow } from "./transcript-list";

export const metadata = { title: "Transcripts" };

export default async function TranscriptsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; class?: string }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  if (!session) redirect("/login");

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  if (!isAdmin) redirect("/grades");

  const searchQuery = params.q?.trim() ?? "";
  const activeClassId = params.class || "";

  const activeYear = await db.academicYear.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  });

  const classes = activeYear
    ? await db.academicClass.findMany({
        where: { academicYearId: activeYear.id },
        select: { id: true, name: true },
        orderBy: [{ program: { name: "asc" } }, { yearLevel: "asc" }],
      })
    : [];

  const studentWhere: Record<string, unknown> = {};
  if (searchQuery) {
    studentWhere.OR = [
      { studentIdNumber: { contains: searchQuery, mode: "insensitive" } },
      { user: { fullName: { contains: searchQuery, mode: "insensitive" } } },
    ];
  }
  if (activeClassId) {
    studentWhere.classStudents = {
      some: { classId: activeClassId, status: "ACTIVE" },
    };
  }

  const raw = await db.student.findMany({
    where: studentWhere,
    include: {
      user: { select: { fullName: true } },
      program: { select: { name: true } },
      enrollments: {
        include: {
          courseEnrollments: {
            include: {
              grade: true,
              subject: { select: { creditHours: true } },
            },
          },
        },
      },
    },
    orderBy: { studentIdNumber: "asc" },
    take: 200,
  });

  const students: StudentRow[] = raw.map((s) => {
    const graded = s.enrollments.flatMap((e) =>
      e.courseEnrollments.filter(
        (ce) => ce.grade && ce.grade.status === "APPROVED",
      ),
    );
    const totalCredits = graded.reduce((sum, ce) => sum + ce.subject.creditHours, 0);
    const cgpa =
      totalCredits > 0
        ? graded.reduce(
            (sum, ce) => sum + (ce.grade!.gpaPoints ?? 0) * ce.subject.creditHours,
            0,
          ) / totalCredits
        : 0;
    return {
      id: s.id,
      studentIdNumber: s.studentIdNumber,
      fullName: s.user.fullName,
      program: s.program.name,
      gradedCount: graded.length,
      cgpa,
    };
  });

  function filterUrl(overrides: Record<string, string | undefined>) {
    const p = {
      class: activeClassId || undefined,
      q: searchQuery || undefined,
      ...overrides,
    };
    const qs = Object.entries(p)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return `/grades/transcripts${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transcripts</h1>
        <p className="text-muted-foreground">
          View, download, or bulk-download student academic transcripts.
        </p>
      </div>

      {/* Class filter */}
      {classes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Class:</span>
          <Link href={filterUrl({ class: undefined })}>
            <Badge variant={!activeClassId ? "default" : "outline"} className="cursor-pointer">
              All
            </Badge>
          </Link>
          {classes.map((c) => (
            <Link key={c.id} href={filterUrl({ class: c.id })}>
              <Badge
                variant={activeClassId === c.id ? "default" : "outline"}
                className="cursor-pointer"
              >
                {c.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Search */}
      <form className="flex gap-2 max-w-md" action="/grades/transcripts">
        {activeClassId && (
          <input type="hidden" name="class" value={activeClassId} />
        )}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search by name or student ID…"
            defaultValue={searchQuery}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* Table with bulk-select */}
      <TranscriptList students={students} />
    </div>
  );
}
