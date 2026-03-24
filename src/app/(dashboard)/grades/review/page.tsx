import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import GradeReviewClient from "./grade-review-client";

export const metadata = { title: "Grade Review" };

export default async function GradeReviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    subject?: string;
    status?: string;
    class?: string;
  }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  if (!session) redirect("/login");

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  if (!isAdmin) redirect("/grades");

  const statusFilter = params.status || "SUBMITTED";

  // Fetch classes from the current academic year
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

  const activeClassId = params.class || "";

  // Build grade filter
  const where: Record<string, unknown> = {};

  if (statusFilter !== "all") {
    where.status = statusFilter;
  }
  if (params.subject) {
    where.courseEnrollment = {
      ...(where.courseEnrollment as object),
      subjectId: params.subject,
    };
  }

  // Filter by class: only grades for students in the selected class
  let classStudentIds: string[] | null = null;
  if (activeClassId) {
    const classStudents = await db.classStudent.findMany({
      where: { classId: activeClassId, status: "ACTIVE" },
      select: { studentId: true },
    });
    classStudentIds = classStudents.map((cs) => cs.studentId);
    where.courseEnrollment = {
      ...(typeof where.courseEnrollment === "object"
        ? where.courseEnrollment
        : {}),
      enrollment: { studentId: { in: classStudentIds } },
    };
  }

  const [grades, subjects] = await Promise.all([
    db.grade.findMany({
      where,
      include: {
        courseEnrollment: {
          include: {
            subject: { select: { id: true, code: true, name: true } },
            enrollment: {
              include: {
                student: {
                  include: { user: { select: { fullName: true } } },
                },
              },
            },
          },
        },
        submitter: { select: { fullName: true } },
      },
      orderBy: { submittedDate: "desc" },
    }),
    db.subject.findMany({
      where: {
        courseEnrollments: {
          some: { grade: { isNot: null } },
        },
      },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const activeStatus = statusFilter;

  // Helper to build filter URLs preserving other params
  function filterUrl(overrides: Record<string, string | undefined>) {
    const p = {
      status: activeStatus,
      subject: params.subject,
      class: activeClassId || undefined,
      ...overrides,
    };
    const qs = Object.entries(p)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return `/grades/review${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grade Review</h1>
        <p className="text-muted-foreground">
          Review and approve submitted grades.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Class filter */}
        {classes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Class:</span>
            <Link href={filterUrl({ class: undefined })}>
              <Badge
                variant={!activeClassId ? "default" : "outline"}
                className="cursor-pointer"
              >
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

        {/* Status filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {["SUBMITTED", "APPROVED", "DRAFT", "all"].map((status) => (
            <Link key={status} href={filterUrl({ status })}>
              <Badge
                variant={activeStatus === status ? "default" : "outline"}
                className="cursor-pointer"
              >
                {status === "all" ? "All" : status}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Subject filter */}
        {subjects.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Subject:</span>
            <Link href={filterUrl({ subject: undefined })}>
              <Badge
                variant={!params.subject ? "default" : "outline"}
                className="cursor-pointer"
              >
                All
              </Badge>
            </Link>
            {subjects.map((s) => (
              <Link key={s.id} href={filterUrl({ subject: s.id })}>
                <Badge
                  variant={params.subject === s.id ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {s.code}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      <GradeReviewClient
        grades={grades}
        showActions={activeStatus === "SUBMITTED"}
      />
    </div>
  );
}
