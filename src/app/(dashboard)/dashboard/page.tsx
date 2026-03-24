import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Role } from "@/types";
import { AdminDashboard } from "./admin-dashboard";
import { InstructorDashboard } from "./instructor-dashboard";
import { StudentDashboard } from "./student-dashboard";
import { FinanceDashboard } from "./finance-dashboard";
import { ParentDashboard } from "./parent-dashboard";

export const metadata = { title: "Dashboard" };

async function getAdminStats() {
  const [
    totalStudents,
    activeStudents,
    totalStaff,
    totalPrograms,
    totalDepartments,
    recentAuditLogs,
    // Finance
    totalFees,
    totalPayments,
    pendingFees,
    // Enrollment
    pendingEnrollments,
    approvedEnrollments,
    // Academic
    currentAcademicYear,
    // Announcements
    recentAnnouncements,
    // Attendance (last 30 days)
    attendancePresent,
    attendanceTotal,
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
    // Finance
    db.studentFee.aggregate({ _sum: { amountCharged: true } }),
    db.payment.aggregate({ _sum: { amount: true } }),
    db.studentFee.count({ where: { status: "UNPAID" } }),
    // Enrollment
    db.enrollment.count({ where: { status: "PENDING" } }),
    db.enrollment.count({ where: { status: "APPROVED" } }),
    // Academic
    db.academicYear.findFirst({
      where: { isCurrent: true },
      include: {
        semesters: { orderBy: { startDate: "asc" } },
      },
    }),
    // Announcements
    db.announcement.findMany({
      take: 5,
      orderBy: { publishDate: "desc" },
      include: { author: { select: { fullName: true } } },
    }),
    // Attendance (last 30 days)
    db.attendance.count({
      where: {
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        status: "PRESENT",
      },
    }),
    db.attendance.count({
      where: {
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const totalBilled = Number(totalFees._sum.amountCharged ?? 0);
  const totalCollected = Number(totalPayments._sum.amount ?? 0);
  const outstanding = totalBilled - totalCollected;

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
    finance: {
      totalBilled,
      totalCollected,
      outstanding,
      pendingFees,
      collectionRate:
        totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0,
    },
    enrollment: {
      pending: pendingEnrollments,
      approved: approvedEnrollments,
    },
    academic: currentAcademicYear
      ? {
          yearName: currentAcademicYear.name,
          startDate: currentAcademicYear.startDate.toISOString(),
          endDate: currentAcademicYear.endDate.toISOString(),
          semesters: currentAcademicYear.semesters.map((s) => ({
            name: s.name,
            startDate: s.startDate.toISOString(),
            endDate: s.endDate.toISOString(),
            isCurrent: s.isCurrent,
          })),
        }
      : null,
    announcements: recentAnnouncements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body.length > 120 ? a.body.slice(0, 120) + "…" : a.body,
      author: a.author.fullName,
      publishDate: a.publishDate.toISOString(),
      targetAudience: a.targetAudience,
    })),
    attendance: {
      present: attendancePresent,
      total: attendanceTotal,
      rate:
        attendanceTotal > 0
          ? Math.round((attendancePresent / attendanceTotal) * 100)
          : 0,
    },
  };
}

async function getSharedData(userRole: string) {
  // Build audience filter based on role
  const audienceValues = [
    "ALL",
    ...(userRole === "STUDENT" ? ["STUDENTS"] : []),
    ...(userRole === "INSTRUCTOR" ? ["INSTRUCTORS", "STAFF"] : []),
    ...(userRole === "PARENT" ? ["PARENTS"] : []),
    ...(userRole === "FINANCE" ? ["STAFF"] : []),
  ];

  const [currentAcademicYear, announcements] = await Promise.all([
    db.academicYear.findFirst({
      where: { isCurrent: true },
      include: { semesters: { orderBy: { startDate: "asc" } } },
    }),
    db.announcement.findMany({
      where: { targetAudience: { in: audienceValues } },
      take: 5,
      orderBy: { publishDate: "desc" },
      include: { author: { select: { fullName: true } } },
    }),
  ]);

  return {
    academic: currentAcademicYear
      ? {
          yearName: currentAcademicYear.name,
          startDate: currentAcademicYear.startDate.toISOString(),
          endDate: currentAcademicYear.endDate.toISOString(),
          semesters: currentAcademicYear.semesters.map((s) => ({
            id: s.id,
            name: s.name,
            startDate: s.startDate.toISOString(),
            endDate: s.endDate.toISOString(),
            isCurrent: s.isCurrent,
          })),
        }
      : null,
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body.length > 120 ? a.body.slice(0, 120) + "…" : a.body,
      author: a.author.fullName,
      publishDate: a.publishDate.toISOString(),
      targetAudience: a.targetAudience,
    })),
  };
}

async function getInstructorStats(userId: string) {
  const staff = await db.staff.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!staff) return null;

  const currentSemester = await db.semester.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  });

  const [assignedSubjects, timetableEntries, attendanceMarked, pendingGrades] =
    await Promise.all([
      db.subjectInstructor.count({ where: { staffId: staff.id } }),
      currentSemester
        ? db.timetableEntry.findMany({
            where: {
              instructorId: staff.id,
              semesterId: currentSemester.id,
            },
            include: { subject: { select: { name: true, code: true } } },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          })
        : [],
      db.attendance.count({
        where: {
          markedBy: userId,
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      db.grade.count({
        where: {
          submittedBy: userId,
          status: "DRAFT",
        },
      }),
    ]);

  return {
    assignedSubjects,
    upcomingClasses: timetableEntries.length,
    timetable: timetableEntries.map((t) => ({
      id: t.id,
      subjectName: t.subject.name,
      subjectCode: t.subject.code,
      dayOfWeek: t.dayOfWeek,
      startTime: t.startTime,
      endTime: t.endTime,
      room: t.room,
    })),
    attendanceMarked,
    pendingGrades,
  };
}

async function getStudentStats(userId: string) {
  const student = await db.student.findFirst({
    where: { userId },
    select: { id: true, status: true, programId: true, studentIdNumber: true },
  });

  if (!student) return null;

  const currentSemester = await db.semester.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  });

  const [enrollments, grades, fees, timetableEntries, attendanceStats] =
    await Promise.all([
      db.enrollment.count({ where: { studentId: student.id } }),
      db.grade.findMany({
        where: {
          courseEnrollment: { enrollment: { studentId: student.id } },
        },
        select: { totalMarks: true },
      }),
      db.studentFee.findMany({
        where: { studentId: student.id },
        select: {
          amountCharged: true,
          amountPaid: true,
          balance: true,
          status: true,
        },
      }),
      currentSemester
        ? db.timetableEntry.findMany({
            where: {
              semester: { isCurrent: true },
              subject: {
                courseEnrollments: {
                  some: {
                    enrollment: { studentId: student.id },
                  },
                },
              },
            },
            include: {
              subject: { select: { name: true, code: true } },
              instructor: {
                include: { user: { select: { fullName: true } } },
              },
            },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          })
        : [],
      db.attendance.groupBy({
        by: ["status"],
        where: {
          courseEnrollment: { enrollment: { studentId: student.id } },
        },
        _count: true,
      }),
    ]);

  const totalFees = fees.reduce((s, f) => s + Number(f.amountCharged), 0);
  const totalPaid = fees.reduce((s, f) => s + Number(f.amountPaid), 0);
  const presentCount =
    attendanceStats.find((a) => a.status === "PRESENT")?._count ?? 0;
  const totalAttendance = attendanceStats.reduce((s, a) => s + a._count, 0);

  return {
    studentId: student.studentIdNumber,
    status: student.status,
    enrollmentCount: enrollments,
    averageScore:
      grades.length > 0
        ? Math.round(
            grades.reduce((s, g) => s + (g.totalMarks ?? 0), 0) / grades.length,
          )
        : null,
    finance: {
      totalFees,
      totalPaid,
      balance: totalFees - totalPaid,
      unpaidCount: fees.filter((f) => f.status === "UNPAID").length,
    },
    timetable: timetableEntries.map((t) => ({
      id: t.id,
      subjectName: t.subject.name,
      subjectCode: t.subject.code,
      instructor: t.instructor.user.fullName,
      dayOfWeek: t.dayOfWeek,
      startTime: t.startTime,
      endTime: t.endTime,
      room: t.room,
    })),
    attendance: {
      present: presentCount,
      total: totalAttendance,
      rate:
        totalAttendance > 0
          ? Math.round((presentCount / totalAttendance) * 100)
          : 0,
    },
  };
}

async function getFinanceStats() {
  const [totalFees, payments, pendingCount, recentPayments, unpaidStudents] =
    await Promise.all([
      db.studentFee.aggregate({ _sum: { amountCharged: true } }),
      db.payment.aggregate({ _sum: { amount: true } }),
      db.studentFee.count({ where: { status: "PENDING" } }),
      db.payment.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            include: { user: { select: { fullName: true } } },
          },
        },
      }),
      db.studentFee.count({ where: { status: "UNPAID" } }),
    ]);

  return {
    totalBilled: Number(totalFees._sum.amountCharged ?? 0),
    totalCollected: Number(payments._sum.amount ?? 0),
    pendingPayments: pendingCount,
    unpaidStudents,
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      studentName: p.student.user.fullName,
      amount: Number(p.amount),
      method: p.paymentMethod,
      receiptNumber: p.receiptNumber,
      date: p.paymentDate.toISOString(),
    })),
  };
}

async function getParentStats(userId: string) {
  const children = await db.parentStudent.findMany({
    where: { parentId: userId },
    include: {
      student: {
        include: {
          user: { select: { fullName: true } },
          program: { select: { name: true } },
          studentFees: {
            select: {
              amountCharged: true,
              amountPaid: true,
              status: true,
            },
          },
          enrollments: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { status: true },
          },
        },
      },
    },
  });

  return {
    children: children.map((c) => {
      const totalFees = c.student.studentFees.reduce(
        (s, f) => s + Number(f.amountCharged),
        0,
      );
      const totalPaid = c.student.studentFees.reduce(
        (s, f) => s + Number(f.amountPaid),
        0,
      );
      return {
        id: c.student.id,
        name: c.student.user.fullName,
        studentId: c.student.studentIdNumber,
        program: c.student.program.name,
        status: c.student.status,
        enrollmentStatus: c.student.enrollments[0]?.status ?? "N/A",
        fees: {
          total: totalFees,
          paid: totalPaid,
          balance: totalFees - totalPaid,
        },
      };
    }),
  };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const role = session.role as Role;
  const shared = await getSharedData(session.role);

  if (role === Role.SUPER_ADMIN || role === Role.ADMIN) {
    const stats = await getAdminStats();
    return <AdminDashboard stats={stats} user={session} />;
  }

  if (role === Role.INSTRUCTOR) {
    const stats = await getInstructorStats(session.id);
    return <InstructorDashboard stats={stats} shared={shared} user={session} />;
  }

  if (role === Role.STUDENT) {
    const stats = await getStudentStats(session.id);
    return <StudentDashboard stats={stats} shared={shared} user={session} />;
  }

  if (role === Role.FINANCE) {
    const stats = await getFinanceStats();
    return <FinanceDashboard stats={stats} shared={shared} user={session} />;
  }

  if (role === Role.PARENT) {
    const stats = await getParentStats(session.id);
    return <ParentDashboard stats={stats} shared={shared} user={session} />;
  }

  // Fallback
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
