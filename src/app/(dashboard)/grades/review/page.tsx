import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import GradeReviewClient from "./grade-review-client";

export const metadata = { title: "Grade Review" };

export default async function GradeReviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const grades = await db.grade.findMany({
    where: { status: "SUBMITTED" },
    include: {
      courseEnrollment: {
        include: {
          subject: { select: { code: true, name: true } },
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
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grade Review</h1>
        <p className="text-muted-foreground">
          Review and approve submitted grades.
        </p>
      </div>
      <GradeReviewClient grades={grades} />
    </div>
  );
}
