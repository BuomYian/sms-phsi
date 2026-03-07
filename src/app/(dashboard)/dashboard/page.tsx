import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Role } from "@/types";
import { AdminDashboard } from "./admin-dashboard";
import { InstructorDashboard } from "./instructor-dashboard";
import { StudentDashboard } from "./student-dashboard";
import { FinanceDashboard } from "./finance-dashboard";

export const metadata = { title: "Dashboard" };

async function getAdminStats() {
  const [
    totalStudents,
    activeStudents,
    totalStaff,
    totalPrograms,
    totalDepartments,
    recentAuditLogs,
  ] = await Promise.all([
    db.student.count(),
    db.student.count({ where: { status: "ACTIVE" } }),
    db.staff.count(),
    db.program.count({ where: { isActive: true } }),
    db.department.count(),
    db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true } } },
    }),
  ]);

  return {
    totalStudents,
    activeStudents,
    totalStaff,
    totalPrograms,
    totalDepartments,
    recentActivity: recentAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      target: `${log.entityType}${log.user ? ` by ${log.user.fullName}` : ""}`,
      timestamp: log.createdAt.toISOString(),
      type: "info" as const,
    })),
  };
}

async function getInstructorStats(userId: string) {
  const staff = await db.staff.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!staff) return null;

  const [assignedSubjects, upcomingClasses] = await Promise.all([
    db.subjectInstructor.count({ where: { staffId: staff.id } }),
    db.timetableEntry.count({
      where: { instructorId: staff.id },
    }),
  ]);

  return { assignedSubjects, upcomingClasses };
}

async function getStudentStats(userId: string) {
  const student = await db.student.findFirst({
    where: { userId },
    select: { id: true, status: true, programId: true },
  });

  if (!student) return null;

  const [enrollments, grades] = await Promise.all([
    db.enrollment.count({
      where: { studentId: student.id },
    }),
    db.grade.findMany({
      where: {
        courseEnrollment: {
          enrollment: { studentId: student.id },
        },
      },
      select: { totalMarks: true },
    }),
  ]);

  return {
    enrollmentCount: enrollments,
    averageScore:
      grades.length > 0
        ? Math.round(
            grades.reduce((s, g) => s + (g.totalMarks ?? 0), 0) / grades.length,
          )
        : null,
  };
}

async function getFinanceStats() {
  const [totalFees, payments, pendingCount] = await Promise.all([
    db.studentFee.aggregate({ _sum: { amountCharged: true } }),
    db.payment.aggregate({ _sum: { amount: true } }),
    db.studentFee.count({ where: { status: "PENDING" } }),
  ]);

  return {
    totalBilled: Number(totalFees._sum.amountCharged ?? 0),
    totalCollected: Number(payments._sum.amount ?? 0),
    pendingPayments: pendingCount,
  };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const role = session.role as Role;

  if (role === Role.SUPER_ADMIN || role === Role.ADMIN) {
    const stats = await getAdminStats();
    return <AdminDashboard stats={stats} user={session} />;
  }

  if (role === Role.INSTRUCTOR) {
    const stats = await getInstructorStats(session.id);
    return <InstructorDashboard stats={stats} user={session} />;
  }

  if (role === Role.STUDENT) {
    const stats = await getStudentStats(session.id);
    return <StudentDashboard stats={stats} user={session} />;
  }

  if (role === Role.FINANCE) {
    const stats = await getFinanceStats();
    return <FinanceDashboard stats={stats} user={session} />;
  }

  // Parent / fallback
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Welcome, {session.fullName}
      </h1>
      <p className="text-muted-foreground">
        Your dashboard is being prepared. Please check back later.
      </p>
    </div>
  );
}
