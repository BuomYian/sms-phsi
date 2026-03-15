import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PenLine,
  CheckCircle,
  Award,
  FileText,
  Calendar,
  ClipboardCheck,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export const metadata = { title: "Grades & Exams" };

export default async function GradesPage() {
  const session = await getSession();
  if (!session) return null;

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  const isInstructor = session.role === "INSTRUCTOR";
  const isStudent = session.role === "STUDENT";

  // Summary stats
  const [totalGrades, submittedGrades, approvedGrades, upcomingExams] =
    await Promise.all([
      db.grade.count(),
      db.grade.count({ where: { status: "SUBMITTED" } }),
      db.grade.count({ where: { status: "APPROVED" } }),
      db.examSchedule.count({ where: { date: { gte: new Date() } } }),
    ]);

  type Section = {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    badge?: string;
    roles: string[];
  };

  const sections: Section[] = [
    {
      title: "Grade Entry",
      description: "Enter CA and exam scores for students",
      icon: PenLine,
      href: "/grades/enter",
      roles: ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"],
    },
    {
      title: "Grade Review",
      description: "Review and approve submitted grades",
      icon: CheckCircle,
      href: "/grades/review",
      badge: submittedGrades > 0 ? `${submittedGrades} pending` : undefined,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: "My Results",
      description: "View your academic results",
      icon: Award,
      href: "/grades/my-results",
      roles: ["STUDENT"],
    },
    {
      title: "Transcripts",
      description: "Generate student transcripts",
      icon: FileText,
      href: "/grades/transcripts",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: "Exam Schedule",
      description: "View and manage exam timetable",
      icon: Calendar,
      badge: upcomingExams > 0 ? `${upcomingExams} upcoming` : undefined,
      href: "/grades/exams",
      roles: ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "STUDENT"],
    },
  ];

  const visibleSections = isAdmin
    ? sections
    : sections.filter((s) => s.roles.includes(session.role));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grades & Exams</h1>
        <p className="text-muted-foreground">
          {isStudent
            ? "View your academic results and exam schedule."
            : "Grade management, transcripts, and exam scheduling."}
        </p>
      </div>

      {/* Summary stats (admin/instructor only) */}
      {(isAdmin || isInstructor) && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Grades
              </CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalGrades}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">
                {submittedGrades}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {approvedGrades}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Exams
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {upcomingExams}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleSections.map((section) => (
          <Card
            key={section.title}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <section.icon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{section.title}</CardTitle>
              {section.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {section.badge}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {section.description}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href={section.href}>Open →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
