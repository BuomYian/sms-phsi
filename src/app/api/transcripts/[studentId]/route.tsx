import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import path from "path";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import {
  INSTITUTION_NAME,
  INSTITUTION_ADDRESS,
  INSTITUTION_MOTTO,
  DEFAULT_GRADING_SCALE,
} from "@/constants";

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const s = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  watermark: {
    position: "absolute",
    top: "35%",
    left: "10%",
    fontSize: 54,
    color: "#e0e0e0",
    opacity: 0.18,
    transform: "rotate(-35deg)",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 8,
  },
  /* Header */
  headerBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    borderBottom: "2px solid #1a1a1a",
    paddingBottom: 10,
  },
  headerLogo: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  headerCenter: {
    flex: 1,
    textAlign: "center",
  },
  instName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  instAddress: { fontSize: 9, marginTop: 2 },
  instMotto: { fontSize: 8, fontStyle: "italic", marginTop: 2, color: "#555" },
  titleLine: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  /* Student info grid */
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#999",
  },
  infoCell: {
    width: "50%",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  infoLabel: { fontSize: 7, color: "#666", marginBottom: 1 },
  infoValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  /* Semester section */
  semTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f0f0f0",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 10,
    marginBottom: 2,
  },
  /* Table */
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    minHeight: 18,
    alignItems: "center",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    borderBottomWidth: 1,
    borderBottomColor: "#999",
    minHeight: 20,
    alignItems: "center",
    fontFamily: "Helvetica-Bold",
  },
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderTopWidth: 1,
    borderTopColor: "#999",
    minHeight: 20,
    alignItems: "center",
    fontFamily: "Helvetica-Bold",
  },
  colCode: { width: "12%", paddingLeft: 4 },
  colSubject: { width: "28%", paddingLeft: 4 },
  colCenter: { width: "10%", textAlign: "center" },
  colCredits: { width: "10%", textAlign: "center" },
  /* Grading scale */
  scaleTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 4,
  },
  scaleRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    minHeight: 14,
    alignItems: "center",
    fontSize: 8,
  },
  scaleHeader: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    borderBottomWidth: 1,
    borderBottomColor: "#999",
    minHeight: 16,
    alignItems: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  scaleCol: { width: "25%", textAlign: "center" },
  /* Footer */
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#999",
    paddingTop: 5,
  },
  footerText: { fontSize: 7, color: "#666", textAlign: "center" },
  docRef: {
    fontSize: 6.5,
    color: "#888",
    textAlign: "center",
    marginTop: 2,
    fontFamily: "Courier",
  },
  pageNum: {
    fontSize: 7,
    color: "#888",
    textAlign: "right",
    marginTop: 2,
  },
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function buildVerificationHash(
  studentId: string,
  studentIdNumber: string,
  timestamp: string,
): string {
  const secret =
    process.env.JWT_SECRET || "phsi-default-secret-change-in-production";
  return createHmac("sha256", secret)
    .update(`${studentId}:${studentIdNumber}:${timestamp}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/* PDF Document                                                        */
/* ------------------------------------------------------------------ */
interface SemesterRow {
  id: string;
  yearSem: string;
  courses: {
    code: string;
    name: string;
    credits: number;
    ca: number | null;
    exam: number | null;
    total: number | null;
    grade: string | null;
    points: number | null;
  }[];
  semCredits: number;
  semGPA: number;
  cGPA: number;
}

function TranscriptDocument({
  student,
  semesters,
  finalCGPA,
  totalCredits,
  generatedAt,
  docRef,
}: {
  student: {
    fullName: string;
    studentIdNumber: string;
    program: string;
    department: string;
  };
  semesters: SemesterRow[];
  finalCGPA: number;
  totalCredits: number;
  generatedAt: string;
  docRef: string;
}) {
  return (
    <Document
      title={`Transcript - ${student.fullName}`}
      author={INSTITUTION_NAME}
      subject="Official Academic Transcript"
      creator={INSTITUTION_NAME}
    >
      <Page size="A4" style={s.page}>
        {/* Watermark */}
        <Text style={s.watermark} fixed>
          OFFICIAL TRANSCRIPT
        </Text>

        {/* Institution Header */}
        <View style={s.headerBox} fixed>
          <Image
            style={s.headerLogo}
            src={path.join(process.cwd(), "public/phsi-logo.png")}
          />
          <View style={s.headerCenter}>
            <Text style={s.instName}>{INSTITUTION_NAME}</Text>
            <Text style={s.instAddress}>{INSTITUTION_ADDRESS}</Text>
            <Text style={s.instMotto}>{INSTITUTION_MOTTO}</Text>
            <Text style={s.titleLine}>Official Academic Transcript</Text>
          </View>
          <Image
            style={s.headerLogo}
            src={path.join(process.cwd(), "public/prda-logo.jpeg")}
          />
        </View>

        {/* Student Information */}
        <View style={s.infoGrid}>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Student Name</Text>
            <Text style={s.infoValue}>{student.fullName}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Student ID</Text>
            <Text style={s.infoValue}>{student.studentIdNumber}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Program</Text>
            <Text style={s.infoValue}>{student.program}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Department</Text>
            <Text style={s.infoValue}>{student.department}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Cumulative GPA (CGPA)</Text>
            <Text style={s.infoValue}>
              {finalCGPA > 0 ? finalCGPA.toFixed(2) : "—"}
            </Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Total Credits Earned</Text>
            <Text style={s.infoValue}>{totalCredits}</Text>
          </View>
        </View>

        {/* Semester Results */}
        {semesters.map((sem) => (
          <View key={sem.id} wrap={false}>
            <Text style={s.semTitle}>
              {sem.yearSem}
              {"    "}GPA: {sem.semGPA > 0 ? sem.semGPA.toFixed(2) : "—"}
              {"    "}CGPA: {sem.cGPA > 0 ? sem.cGPA.toFixed(2) : "—"}
            </Text>

            {/* Table header */}
            <View style={s.tableHeader}>
              <Text style={s.colCode}>Code</Text>
              <Text style={s.colSubject}>Subject</Text>
              <Text style={s.colCredits}>Credits</Text>
              <Text style={s.colCenter}>CA</Text>
              <Text style={s.colCenter}>Exam</Text>
              <Text style={s.colCenter}>Total</Text>
              <Text style={s.colCenter}>Grade</Text>
              <Text style={s.colCenter}>Points</Text>
            </View>

            {/* Course rows */}
            {sem.courses.map((c, i) => (
              <View style={s.tableRow} key={i}>
                <Text style={s.colCode}>{c.code}</Text>
                <Text style={s.colSubject}>{c.name}</Text>
                <Text style={s.colCredits}>{c.credits}</Text>
                <Text style={s.colCenter}>{c.ca ?? "—"}</Text>
                <Text style={s.colCenter}>{c.exam ?? "—"}</Text>
                <Text style={s.colCenter}>{c.total ?? "—"}</Text>
                <Text style={s.colCenter}>{c.grade ?? "—"}</Text>
                <Text style={s.colCenter}>
                  {c.points != null ? c.points.toFixed(1) : "—"}
                </Text>
              </View>
            ))}

            {/* Summary row */}
            <View style={s.summaryRow}>
              <Text style={s.colCode} />
              <Text style={s.colSubject}>Semester Total</Text>
              <Text style={s.colCredits}>{sem.semCredits}</Text>
              <Text style={s.colCenter} />
              <Text style={s.colCenter} />
              <Text style={s.colCenter} />
              <Text style={s.colCenter}>
                GPA: {sem.semGPA > 0 ? sem.semGPA.toFixed(2) : "—"}
              </Text>
              <Text style={s.colCenter} />
            </View>
          </View>
        ))}

        {/* Grading Scale */}
        <View wrap={false}>
          <Text style={s.scaleTitle}>Grading Scale</Text>
          <View style={s.scaleHeader}>
            <Text style={s.scaleCol}>Grade</Text>
            <Text style={s.scaleCol}>Marks Range</Text>
            <Text style={s.scaleCol}>GPA Points</Text>
            <Text style={s.scaleCol}>Description</Text>
          </View>
          {DEFAULT_GRADING_SCALE.map((g) => (
            <View style={s.scaleRow} key={g.letter}>
              <Text style={s.scaleCol}>{g.letter}</Text>
              <Text style={s.scaleCol}>
                {g.minScore}–{g.maxScore}
              </Text>
              <Text style={s.scaleCol}>{g.gpaPoints.toFixed(1)}</Text>
              <Text style={s.scaleCol}>{g.description}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {INSTITUTION_NAME} • {INSTITUTION_ADDRESS}
          </Text>
          <Text style={s.footerText}>
            This is an official computer-generated transcript. Any unauthorized
            alteration renders this document void.
          </Text>
          <Text style={s.docRef}>
            Generated: {generatedAt} | Document Ref: {docRef}
          </Text>
          <Text
            style={s.pageNum}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

/* ------------------------------------------------------------------ */
/* API Handler                                                         */
/* ------------------------------------------------------------------ */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId } = await params;

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { fullName: true } },
      program: {
        select: { name: true, department: { select: { name: true } } },
      },
      enrollments: {
        include: {
          semester: {
            include: { academicYear: { select: { name: true } } },
          },
          courseEnrollments: {
            include: {
              subject: {
                select: { code: true, name: true, creditHours: true },
              },
              grade: true,
            },
            orderBy: { subject: { code: "asc" } },
          },
        },
        orderBy: { semester: { startDate: "asc" } },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // ---------- Compute semester data ----------
  let cumulativeCredits = 0;
  let cumulativeWeightedPoints = 0;

  const semesters: SemesterRow[] = student.enrollments.map((enrollment) => {
    const gradedCourses = enrollment.courseEnrollments.filter(
      (ce) => ce.grade && ce.grade.status === "APPROVED",
    );

    const semCredits = gradedCourses.reduce(
      (sum, ce) => sum + ce.subject.creditHours,
      0,
    );
    const semWeighted = gradedCourses.reduce(
      (sum, ce) => sum + (ce.grade!.gpaPoints ?? 0) * ce.subject.creditHours,
      0,
    );
    const semGPA = semCredits > 0 ? semWeighted / semCredits : 0;

    cumulativeCredits += semCredits;
    cumulativeWeightedPoints += semWeighted;
    const cGPA =
      cumulativeCredits > 0 ? cumulativeWeightedPoints / cumulativeCredits : 0;

    return {
      id: enrollment.id,
      yearSem: `${enrollment.semester.academicYear.name} — ${enrollment.semester.name}`,
      courses: enrollment.courseEnrollments.map((ce) => ({
        code: ce.subject.code,
        name: ce.subject.name,
        credits: ce.subject.creditHours,
        ca: ce.grade?.caMarks ?? null,
        exam: ce.grade?.examMarks ?? null,
        total: ce.grade?.totalMarks ?? null,
        grade: ce.grade?.gradeLetter ?? null,
        points: ce.grade?.gpaPoints ?? null,
      })),
      semCredits,
      semGPA,
      cGPA,
    };
  });

  const finalCGPA =
    cumulativeCredits > 0 ? cumulativeWeightedPoints / cumulativeCredits : 0;

  // ---------- Build tamper-resistance fields ----------
  const generatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
  const docRef = buildVerificationHash(
    student.id,
    student.studentIdNumber,
    generatedAt,
  );

  // ---------- Render PDF ----------
  const buffer = await renderToBuffer(
    <TranscriptDocument
      student={{
        fullName: student.user.fullName,
        studentIdNumber: student.studentIdNumber,
        program: student.program.name,
        department: student.program.department?.name ?? "—",
      }}
      semesters={semesters}
      finalCGPA={finalCGPA}
      totalCredits={cumulativeCredits}
      generatedAt={generatedAt}
      docRef={docRef}
    />,
  );

  const filename = `Transcript_${student.studentIdNumber}_${student.user.fullName.replace(/\s+/g, "_")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
