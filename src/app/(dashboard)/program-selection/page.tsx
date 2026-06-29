import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Clock, CheckCircle2, XCircle, Plus } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { STATUS_COLORS } from "@/constants";

export const metadata = { title: "Program Selection" };

const FOUNDATION_YEAR_CODE = "FOUND-Y1";

export default async function ProgramSelectionPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  const isStudent = session.role === "STUDENT";

  // ── STUDENT VIEW ────────────────────────────────────────────────────────────
  if (isStudent) {
    const student = await db.student.findUnique({
      where: { userId: session.id },
      include: {
        program: true,
        programSelections: {
          include: { requestedProgram: true, reviewer: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) redirect("/dashboard");

    const isFoundationYear = student.program.code === FOUNDATION_YEAR_CODE;
    const latestSelection = student.programSelections[0] ?? null;
    const hasPending = latestSelection?.status === "PENDING";
    const hasApproved = latestSelection?.status === "APPROVED";
    const canSubmit =
      isFoundationYear && !hasPending && !hasApproved;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Program Selection</h1>
          <p className="text-muted-foreground">
            Choose your specialisation after completing Foundation Year.
          </p>
        </div>

        {/* Current status card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Current Programme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-32">Programme</span>
              <span className="font-medium">{student.program.name}</span>
              {isFoundationYear && (
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  Foundation Year
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-32">Year of Study</span>
              <span className="font-medium">Year {student.yearOfStudy}</span>
            </div>
          </CardContent>
        </Card>

        {/* Selection request card */}
        {latestSelection && (
          <Card>
            <CardHeader>
              <CardTitle>Programme Selection Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-32">Requested</span>
                <span className="font-medium">
                  {latestSelection.requestedProgram.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-32">Status</span>
                <Badge className={STATUS_COLORS[latestSelection.status]}>
                  {latestSelection.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-32">Submitted</span>
                <span className="text-sm">{formatDate(latestSelection.createdAt)}</span>
              </div>
              {latestSelection.reviewedAt && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-32">Reviewed</span>
                  <span className="text-sm">
                    {formatDate(latestSelection.reviewedAt)}
                    {latestSelection.reviewer &&
                      ` by ${latestSelection.reviewer.fullName}`}
                  </span>
                </div>
              )}
              {latestSelection.notes && (
                <div className="flex items-start gap-3">
                  <span className="text-sm text-muted-foreground w-32">Notes</span>
                  <span className="text-sm">{latestSelection.notes}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action */}
        {!isFoundationYear && !hasApproved && (
          <p className="text-sm text-muted-foreground">
            Program selection is only available to Foundation Year students.
          </p>
        )}
        {hasApproved && (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Your programme selection has been approved. You are now enrolled in{" "}
            <strong>{latestSelection?.requestedProgram.name}</strong>.
          </div>
        )}
        {canSubmit && (
          <Button asChild>
            <Link href="/program-selection/new">
              <Plus className="mr-2 h-4 w-4" />
              Choose My Programme
            </Link>
          </Button>
        )}
        {latestSelection?.status === "REJECTED" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              Your previous selection was rejected. You may submit a new request.
            </div>
            <Button asChild>
              <Link href="/program-selection/new">
                <Plus className="mr-2 h-4 w-4" />
                Submit New Request
              </Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── ADMIN VIEW ───────────────────────────────────────────────────────────────
  if (isAdmin) {
    const [pendingCount, approvedCount, rejectedCount, selections] =
      await Promise.all([
        db.programSelection.count({ where: { status: "PENDING" } }),
        db.programSelection.count({ where: { status: "APPROVED" } }),
        db.programSelection.count({ where: { status: "REJECTED" } }),
        db.programSelection.findMany({
          include: {
            student: { include: { user: true, program: true } },
            requestedProgram: true,
            reviewer: true,
          },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        }),
      ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Program Selection</h1>
          <p className="text-muted-foreground">
            Review and approve student programme selection requests.
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests table */}
        <Card>
          <CardHeader>
            <CardTitle>All Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {selections.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No programme selection requests yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-3 pr-4 font-medium">Student</th>
                      <th className="text-left py-3 pr-4 font-medium">Current</th>
                      <th className="text-left py-3 pr-4 font-medium">Requested</th>
                      <th className="text-left py-3 pr-4 font-medium">Status</th>
                      <th className="text-left py-3 pr-4 font-medium">Date</th>
                      <th className="text-left py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selections.map((sel) => (
                      <tr key={sel.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{sel.student.user.fullName}</div>
                          <div className="text-muted-foreground text-xs">
                            {sel.student.studentIdNumber}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {sel.student.program.name}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {sel.requestedProgram.name}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge className={STATUS_COLORS[sel.status]}>
                            {sel.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatDate(sel.createdAt)}
                        </td>
                        <td className="py-3">
                          {sel.status === "PENDING" ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/program-selection/${sel.id}`}>Review</Link>
                            </Button>
                          ) : (
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/program-selection/${sel.id}`}>View</Link>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  redirect("/dashboard");
}
