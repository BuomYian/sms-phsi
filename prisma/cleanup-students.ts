/**
 * One-time cleanup script: removes all student and parent data while
 * preserving admins, instructors, programs, subjects, fee structures,
 * timetables, class cohorts, and all system configuration.
 *
 * Run with: npx tsx prisma/cleanup-students.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting student data cleanup...\n");

  // 1 — Program selections (references Student)
  const ps = await prisma.programSelection.deleteMany({});
  console.log(`✅ Deleted ${ps.count} program selection request(s)`);

  // 2 — Attendance (via CourseEnrollment → Enrollment → Student)
  const att = await prisma.attendance.deleteMany({});
  console.log(`✅ Deleted ${att.count} attendance record(s)`);

  // 3 — Grades (via CourseEnrollment)
  const gr = await prisma.grade.deleteMany({});
  console.log(`✅ Deleted ${gr.count} grade record(s)`);

  // 4 — Course enrollments (child of Enrollment)
  const ce = await prisma.courseEnrollment.deleteMany({});
  console.log(`✅ Deleted ${ce.count} course enrollment(s)`);

  // 5 — Semester enrollments
  const en = await prisma.enrollment.deleteMany({});
  console.log(`✅ Deleted ${en.count} enrollment(s)`);

  // 6 — Class memberships (student ↔ cohort)
  const cs = await prisma.classStudent.deleteMany({});
  console.log(`✅ Deleted ${cs.count} class-student record(s)`);

  // 7 — Student fee obligations
  const sf = await prisma.studentFee.deleteMany({});
  console.log(`✅ Deleted ${sf.count} student fee record(s)`);

  // 8 — Payment records
  const py = await prisma.payment.deleteMany({});
  console.log(`✅ Deleted ${py.count} payment record(s)`);

  // 9 — Scholarships
  const sc = await prisma.scholarship.deleteMany({});
  console.log(`✅ Deleted ${sc.count} scholarship record(s)`);

  // 10 — Documents
  const doc = await prisma.document.deleteMany({});
  console.log(`✅ Deleted ${doc.count} document record(s)`);

  // 11 — Parent ↔ student links
  const psl = await prisma.parentStudent.deleteMany({});
  console.log(`✅ Deleted ${psl.count} parent-student link(s)`);

  // 12 — Announcement reads for student / parent users
  const studentUserIds = await prisma.user
    .findMany({
      where: { role: { in: ["STUDENT", "PARENT"] } },
      select: { id: true },
    })
    .then((rows) => rows.map((r) => r.id));

  const ar = await prisma.announcementRead.deleteMany({
    where: { userId: { in: studentUserIds } },
  });
  console.log(`✅ Deleted ${ar.count} announcement read record(s)`);

  // 13 — Student profile records
  const stu = await prisma.student.deleteMany({});
  console.log(`✅ Deleted ${stu.count} student profile(s)`);

  // 14 — Messages sent or received by student / parent users
  const msg = await prisma.message.deleteMany({
    where: {
      OR: [
        { senderId: { in: studentUserIds } },
        { recipientId: { in: studentUserIds } },
      ],
    },
  });
  console.log(`✅ Deleted ${msg.count} message(s)`);

  // 15 — Audit log entries for student / parent users
  const al = await prisma.auditLog.deleteMany({
    where: { userId: { in: studentUserIds } },
  });
  console.log(`✅ Deleted ${al.count} audit log entry(ies)`);

  // 16 — User accounts (STUDENT and PARENT roles only)
  const users = await prisma.user.deleteMany({
    where: { role: { in: ["STUDENT", "PARENT"] } },
  });
  console.log(`✅ Deleted ${users.count} user account(s) (students + parents)`);

  console.log("\n🎉 Cleanup complete. The following data was PRESERVED:");
  console.log("   • Admin and Instructor user accounts + Staff records");
  console.log("   • Departments, Programs, Subjects");
  console.log("   • Academic Years and Semesters");
  console.log("   • Fee Structures");
  console.log("   • Timetable entries and Exam schedules");
  console.log("   • Subject-Instructor assignments");
  console.log("   • Academic class cohorts (now empty)");
  console.log("   • Announcements and Messages (between staff)");
  console.log("   • System Settings");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
