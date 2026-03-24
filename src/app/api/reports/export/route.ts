import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ];
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    session.role !== "SUPER_ADMIN" &&
    session.role !== "ADMIN" &&
    session.role !== "FINANCE"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type");

  let csv = "";
  let filename = "report.csv";

  switch (type) {
    case "students": {
      const students = await db.student.findMany({
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
          program: { select: { name: true, code: true } },
        },
        orderBy: { studentIdNumber: "asc" },
      });
      csv = toCsv(
        [
          "Student ID",
          "Full Name",
          "Email",
          "Phone",
          "Gender",
          "Status",
          "Program",
          "Program Code",
          "Admission Type",
        ],
        students.map((s) => [
          s.studentIdNumber,
          s.user.fullName,
          s.user.email,
          s.user.phone || "",
          s.gender,
          s.status,
          s.program.name,
          s.program.code,
          s.admissionType,
        ]),
      );
      filename = "students-report.csv";
      break;
    }

    case "staff": {
      const staff = await db.staff.findMany({
        include: {
          user: {
            select: { fullName: true, email: true, phone: true, role: true },
          },
          department: { select: { name: true } },
        },
        orderBy: { staffIdNumber: "asc" },
      });
      csv = toCsv(
        [
          "Staff ID",
          "Full Name",
          "Email",
          "Phone",
          "Role",
          "Department",
          "Designation",
          "Employment Type",
        ],
        staff.map((s) => [
          s.staffIdNumber,
          s.user.fullName,
          s.user.email,
          s.user.phone || "",
          s.user.role,
          s.department?.name || "",
          s.designation,
          s.employmentType,
        ]),
      );
      filename = "staff-report.csv";
      break;
    }

    case "financial": {
      const payments = await db.payment.findMany({
        include: {
          student: {
            include: { user: { select: { fullName: true } } },
          },
        },
        orderBy: { paymentDate: "desc" },
      });
      csv = toCsv(
        [
          "Date",
          "Student",
          "Amount",
          "Currency",
          "Method",
          "Receipt No",
          "Reference No",
        ],
        payments.map((p) => [
          p.paymentDate.toISOString().split("T")[0],
          p.student.user.fullName,
          p.amount.toString(),
          p.currency,
          p.paymentMethod,
          p.receiptNumber || "",
          p.referenceNumber || "",
        ]),
      );
      filename = "financial-report.csv";
      break;
    }

    case "attendance": {
      const records = await db.attendance.findMany({
        include: {
          courseEnrollment: {
            include: {
              subject: { select: { name: true, code: true } },
              enrollment: {
                include: {
                  student: {
                    include: { user: { select: { fullName: true } } },
                  },
                },
              },
            },
          },
        },
        orderBy: { date: "desc" },
        take: 5000,
      });
      csv = toCsv(
        ["Date", "Student", "Subject", "Subject Code", "Status"],
        records.map((r) => [
          r.date.toISOString().split("T")[0],
          r.courseEnrollment.enrollment.student.user.fullName,
          r.courseEnrollment.subject.name,
          r.courseEnrollment.subject.code,
          r.status,
        ]),
      );
      filename = "attendance-report.csv";
      break;
    }

    case "academic": {
      const grades = await db.grade.findMany({
        where: { status: "APPROVED" },
        include: {
          courseEnrollment: {
            include: {
              subject: {
                select: { name: true, code: true, creditHours: true },
              },
              enrollment: {
                include: {
                  student: {
                    include: { user: { select: { fullName: true } } },
                  },
                  semester: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { approvedDate: "desc" },
      });
      csv = toCsv(
        [
          "Student",
          "Subject",
          "Subject Code",
          "Credits",
          "Semester",
          "CA Marks",
          "Exam Marks",
          "Total",
          "Grade",
          "GPA",
        ],
        grades.map((g) => [
          g.courseEnrollment.enrollment.student.user.fullName,
          g.courseEnrollment.subject.name,
          g.courseEnrollment.subject.code,
          g.courseEnrollment.subject.creditHours.toString(),
          g.courseEnrollment.enrollment.semester.name,
          (g.caMarks ?? "").toString(),
          (g.examMarks ?? "").toString(),
          (g.totalMarks ?? "").toString(),
          g.gradeLetter ?? "",
          (g.gpaPoints ?? "").toString(),
        ]),
      );
      filename = "academic-report.csv";
      break;
    }

    case "audit": {
      const logs = await db.auditLog.findMany({
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 5000,
      });
      csv = toCsv(
        [
          "Timestamp",
          "User",
          "Email",
          "Action",
          "Entity Type",
          "Entity ID",
          "Details",
        ],
        logs.map((l) => [
          l.createdAt.toISOString(),
          l.user.fullName,
          l.user.email,
          l.action,
          l.entityType,
          l.entityId || "",
          l.details ? JSON.stringify(l.details) : "",
        ]),
      );
      filename = "audit-log.csv";
      break;
    }

    default:
      return NextResponse.json(
        { error: "Invalid report type" },
        { status: 400 },
      );
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
