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
  searchParams: Promise<{ subject?: string; status?: string }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  if (!session) redirect("/login");

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  if (!isAdmin) redirect("/grades");

  const statusFilter = params.status || "SUBMITTED";
  const where: Record<string, unknown> = {};

  if (statusFilter !== "all") {
    where.status = statusFilter;
  }
  if (params.subject) {
    where.courseEnrollment = { subjectId: params.subject };
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {["SUBMITTED", "APPROVED", "DRAFT", "all"].map((status) => (
            <Link
              key={status}
              href={`/grades/review?status=${status}${params.subject ? `&subject=${params.subject}` : ""}`}
            >
              <Badge
                variant={activeStatus === status ? "default" : "outline"}
                className="cursor-pointer"
              >
                {status === "all" ? "All" : status}
              </Badge>
            </Link>
          ))}
        </div>
        {subjects.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Subject:</span>
            <Link href={`/grades/review?status=${activeStatus}`}>
              <Badge
                variant={!params.subject ? "default" : "outline"}
                className="cursor-pointer"
              >
                All
              </Badge>
            </Link>
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/grades/review?status=${activeStatus}&subject=${s.id}`}
              >
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
