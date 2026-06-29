import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ===========================
  // 0. Clear existing subjects & programs
  // ===========================
  // Delete course-related data first to avoid FK constraints
  await prisma.grade.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.courseEnrollment.deleteMany({});
  await prisma.examSchedule.deleteMany({});
  await prisma.timetableEntry.deleteMany({});
  await prisma.subject.deleteMany({});
  // Delete programs that have no students and are NOT Nursing or Midwifery
  await prisma.program.deleteMany({
    where: {
      code: { notIn: ["DIP-NUR", "DIP-MID", "FOUND-Y1"] },
      students: { none: {} },
    },
  });
  // Delete unused departments
  await prisma.department.deleteMany({
    where: {
      name: { notIn: ["Nursing", "Midwifery", "Administration"] },
      programs: { none: {} },
      staff: { none: {} },
    },
  });
  console.log("✅ Cleared existing subjects and unused programs/departments");

  // ===========================
  // 1. Departments
  // ===========================
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: "Nursing" },
      update: {},
      create: { name: "Nursing", code: "NUR" },
    }),
    prisma.department.upsert({
      where: { name: "Midwifery" },
      update: {},
      create: { name: "Midwifery", code: "MID" },
    }),
    prisma.department.upsert({
      where: { name: "Administration" },
      update: {},
      create: { name: "Administration", code: "ADM" },
    }),
  ]);

  console.log(`✅ Created ${departments.length} departments`);

  const [nursing, midwifery] = departments;

  // ===========================
  // 2. Programs
  // ===========================
  const programs = await Promise.all([
    prisma.program.upsert({
      where: { code: "DIP-NUR" },
      update: {
        name: "Diploma in Nursing",
        durationSemesters: 6,
        totalCredits: 334,
        departmentId: nursing.id,
        description:
          "A comprehensive 3-year diploma program training professional nurses for healthcare delivery in South Sudan.",
        entryRequirements:
          "South Sudan Certificate of Secondary Education (SSCSE) or equivalent with credits in Biology, Chemistry, English, and Mathematics.",
      },
      create: {
        name: "Diploma in Nursing",
        code: "DIP-NUR",
        durationSemesters: 6,
        totalCredits: 334,
        departmentId: nursing.id,
        description:
          "A comprehensive 3-year diploma program training professional nurses for healthcare delivery in South Sudan.",
        entryRequirements:
          "South Sudan Certificate of Secondary Education (SSCSE) or equivalent with credits in Biology, Chemistry, English, and Mathematics.",
      },
    }),
    prisma.program.upsert({
      where: { code: "DIP-MID" },
      update: {
        name: "Diploma in Midwifery",
        durationSemesters: 6,
        totalCredits: 308,
        departmentId: midwifery.id,
        description:
          "A 3-year diploma program training skilled midwives for maternal and child health services in South Sudan.",
        entryRequirements:
          "SSCSE or equivalent with credits in Biology, Chemistry, English, and Mathematics.",
      },
      create: {
        name: "Diploma in Midwifery",
        code: "DIP-MID",
        durationSemesters: 6,
        totalCredits: 308,
        departmentId: midwifery.id,
        description:
          "A 3-year diploma program training skilled midwives for maternal and child health services in South Sudan.",
        entryRequirements:
          "SSCSE or equivalent with credits in Biology, Chemistry, English, and Mathematics.",
      },
    }),
  ]);

  const [administration] = departments.filter((d) => d.name === "Administration");

  await prisma.program.upsert({
    where: { code: "FOUND-Y1" },
    update: {
      name: "Foundation Year",
      durationSemesters: 2,
      totalCredits: 0,
      departmentId: administration.id,
      description:
        "Common first-year program for all incoming students. All students — regardless of their eventual specialisation — study a shared curriculum in Year 1 before choosing between Nursing and Midwifery.",
      isActive: true,
    },
    create: {
      name: "Foundation Year",
      code: "FOUND-Y1",
      durationSemesters: 2,
      totalCredits: 0,
      departmentId: administration.id,
      description:
        "Common first-year program for all incoming students. All students — regardless of their eventual specialisation — study a shared curriculum in Year 1 before choosing between Nursing and Midwifery.",
      isActive: true,
    },
  });

  console.log(`✅ Created ${programs.length} programs + Foundation Year`);

  const [nursingProgram, midwiferyProgram] = programs;

  // ===========================
  // 3. Subjects
  // ===========================

  // -------------------------------------------------------
  // NURSING SUBJECTS (from National Curriculum 2024)
  // -------------------------------------------------------
  const nursingSubjects = [
    // Year 1, Semester 1 (semesterNumber: 1)
    {
      name: "Communication Skills – English",
      code: "COM 111",
      creditHours: 3.6,
      semesterNumber: 1,
    },
    {
      name: "Communication Skills and Study",
      code: "COM 112",
      creditHours: 2,
      semesterNumber: 1,
    },
    {
      name: "Introduction to Information and Communication Technology (ICT)",
      code: "COM 113",
      creditHours: 3,
      semesterNumber: 1,
    },
    {
      name: "Fundamentals of Nursing (1)",
      code: "GNP 111",
      creditHours: 11.3,
      semesterNumber: 1,
    },
    {
      name: "Basic Life Saving Skills",
      code: "GNP 112",
      creditHours: 1.5,
      semesterNumber: 1,
    },
    {
      name: "Anatomy and Physiology (1)",
      code: "APH 111",
      creditHours: 15.3,
      semesterNumber: 1,
    },
    {
      name: "Behavioral Sciences I – Sociology and Anthropology",
      code: "SOC 111",
      creditHours: 3.6,
      semesterNumber: 1,
    },
    {
      name: "Behavioral Sciences I – Sociology and Anthropology (cont.)",
      code: "SOC 112",
      creditHours: 5,
      semesterNumber: 1,
    },
    {
      name: "Behavioral Sciences II – Psychology",
      code: "PSY 111",
      creditHours: 3,
      semesterNumber: 1,
    },
    {
      name: "Introduction to Ethics and Law in Nursing",
      code: "GNP 113",
      creditHours: 3,
      semesterNumber: 1,
    },
    {
      name: "Microbiology and Parasitology",
      code: "MIP 111",
      creditHours: 3,
      semesterNumber: 1,
    },
    {
      name: "Community Health Nursing (1)",
      code: "GNP 114",
      creditHours: 8.6,
      semesterNumber: 1,
    },

    // Year 1, Semester 2 (semesterNumber: 2)
    {
      name: "Biochemistry",
      code: "BIP 121",
      creditHours: 3.5,
      semesterNumber: 2,
    },
    {
      name: "Fundamentals of Nursing (2)",
      code: "GNP 121",
      creditHours: 12.6,
      semesterNumber: 2,
    },
    {
      name: "Anatomy and Physiology (2)",
      code: "APH 121",
      creditHours: 10,
      semesterNumber: 2,
    },
    {
      name: "Behavioural Science II",
      code: "SOC 121",
      creditHours: 1,
      semesterNumber: 2,
    },
    {
      name: "Medical and Surgical Nursing (1)",
      code: "GNP 122",
      creditHours: 10,
      semesterNumber: 2,
    },
    {
      name: "Pharmacology (1)",
      code: "PHA 121",
      creditHours: 6.3,
      semesterNumber: 2,
    },
    {
      name: "Pediatric Nursing (1)",
      code: "GNP 123",
      creditHours: 12,
      semesterNumber: 2,
    },
    {
      name: "Community Health Nursing (2)",
      code: "GNP 124",
      creditHours: 4.3,
      semesterNumber: 2,
    },
    {
      name: "Nutrition and Dietetics",
      code: "NUD 121",
      creditHours: 4.6,
      semesterNumber: 2,
    },

    // Year 2, Semester 1 (semesterNumber: 3)
    {
      name: "Fundamentals of Nursing (3)",
      code: "GNP 211",
      creditHours: 10,
      semesterNumber: 3,
    },
    {
      name: "Medical Surgical Nursing (2)",
      code: "GNP 212",
      creditHours: 9.3,
      semesterNumber: 3,
    },
    {
      name: "Pharmacology (2)",
      code: "PHA 211",
      creditHours: 6.3,
      semesterNumber: 3,
    },
    {
      name: "Pediatrics Nursing (2) incl. IMCI",
      code: "GNP 213",
      creditHours: 8.3,
      semesterNumber: 3,
    },
    {
      name: "Obstetrics (1)",
      code: "GNP 214",
      creditHours: 10,
      semesterNumber: 3,
    },
    {
      name: "Family Planning",
      code: "GNP 215",
      creditHours: 5.6,
      semesterNumber: 3,
    },
    {
      name: "Mental Health and Psychiatric Nursing",
      code: "GNP 216",
      creditHours: 7.6,
      semesterNumber: 3,
    },

    // Year 2, Semester 2 (semesterNumber: 4)
    {
      name: "Medical Surgical Nursing (3)",
      code: "GNP 221",
      creditHours: 18.6,
      semesterNumber: 4,
    },
    {
      name: "Community Health Nursing (3)",
      code: "GNP 222",
      creditHours: 12.6,
      semesterNumber: 4,
    },
    {
      name: "Gynecology Nursing",
      code: "GNP 223",
      creditHours: 12.3,
      semesterNumber: 4,
    },
    {
      name: "Seminar in Clinical Practice",
      code: "GNP 224",
      creditHours: 2.3,
      semesterNumber: 4,
    },
    {
      name: "Pediatrics Nursing (3)",
      code: "GNP 225",
      creditHours: 6.3,
      semesterNumber: 4,
    },
    {
      name: "Introduction to Research",
      code: "GNP 226",
      creditHours: 3.3,
      semesterNumber: 4,
    },

    // Year 3, Semester 1 (semesterNumber: 5)
    {
      name: "Medical Surgical Nursing (4)",
      code: "GNP 311",
      creditHours: 20.3,
      semesterNumber: 5,
    },
    {
      name: "Principles of Management and Leadership",
      code: "GNP 312",
      creditHours: 8,
      semesterNumber: 5,
    },
    {
      name: "Teaching Methodologies",
      code: "GNP 313",
      creditHours: 4,
      semesterNumber: 5,
    },
    {
      name: "Obstetrics (2) and Neonatal Emergency",
      code: "GNP 314",
      creditHours: 16.3,
      semesterNumber: 5,
    },
    {
      name: "Research Project I",
      code: "RES 311",
      creditHours: 4.6,
      semesterNumber: 5,
    },

    // Year 3, Semester 2 (semesterNumber: 6)
    {
      name: "Sexual and Reproductive Health & Rights",
      code: "GNP 321",
      creditHours: 15,
      semesterNumber: 6,
    },
    {
      name: "Gerontology / Geriatric Nursing",
      code: "GNP 323",
      creditHours: 2,
      semesterNumber: 6,
    },
    {
      name: "Nursing Response in Crisis Settings",
      code: "GNP 322",
      creditHours: 18.3,
      semesterNumber: 6,
    },
    {
      name: "Entrepreneurship",
      code: "ENP 322",
      creditHours: 5.5,
      semesterNumber: 6,
    },
    {
      name: "Research Project II",
      code: "RES 321",
      creditHours: 8.6,
      semesterNumber: 6,
    },
  ];

  // -------------------------------------------------------
  // MIDWIFERY SUBJECTS (from National Curriculum - Revised 2016)
  // -------------------------------------------------------
  const midwiferySubjects = [
    // Year 1, Semester 1 (semesterNumber: 1)
    {
      name: "Communication and Study Skills",
      code: "GS 111",
      creditHours: 5.3,
      semesterNumber: 1,
    },
    {
      name: "Introduction to Information Communication Technology",
      code: "BMS 111",
      creditHours: 2.6,
      semesterNumber: 1,
    },
    {
      name: "Anatomy and Physiology I",
      code: "BMS 112",
      creditHours: 13.6,
      semesterNumber: 1,
    },
    {
      name: "Basic Life Saving Skills",
      code: "BMS 113",
      creditHours: 3.3,
      semesterNumber: 1,
    },
    {
      name: "Foundations in Midwifery Practice",
      code: "PMS 111",
      creditHours: 14,
      semesterNumber: 1,
    },
    { name: "Psychology", code: "GS 112", creditHours: 5.3, semesterNumber: 1 },
    { name: "Sociology", code: "GS 113", creditHours: 3.3, semesterNumber: 1 },
    {
      name: "Microbiology",
      code: "GS 114",
      creditHours: 5.6,
      semesterNumber: 1,
    },

    // Year 1, Semester 2 (semesterNumber: 2)
    {
      name: "Anatomy, Physiology (II) and Embryology for Midwives",
      code: "BMS 121",
      creditHours: 12.6,
      semesterNumber: 2,
    },
    {
      name: "Nutrition in Midwifery",
      code: "PMS 121",
      creditHours: 6.6,
      semesterNumber: 2,
    },
    {
      name: "Midwifery Care I – Normal Pregnancy incl. PMTCT",
      code: "PMS 122",
      creditHours: 14.6,
      semesterNumber: 2,
    },
    {
      name: "Pharmacology I",
      code: "BMS 122",
      creditHours: 10,
      semesterNumber: 2,
    },
    {
      name: "Primary Health Care",
      code: "BMS 123",
      creditHours: 10.6,
      semesterNumber: 2,
    },

    // Year 2, Semester 1 (semesterNumber: 3)
    {
      name: "Midwifery Care II – Normal Labour",
      code: "PMS 211",
      creditHours: 16.6,
      semesterNumber: 3,
    },
    {
      name: "Midwifery Care III – Normal Postpartum and Newborn Care",
      code: "PMS 212",
      creditHours: 13.3,
      semesterNumber: 3,
    },
    {
      name: "Pharmacology II",
      code: "BMS 211",
      creditHours: 4,
      semesterNumber: 3,
    },
    {
      name: "Epidemiology",
      code: "BMS 212",
      creditHours: 4,
      semesterNumber: 3,
    },
    {
      name: "Communicable Diseases",
      code: "BMS 213",
      creditHours: 2,
      semesterNumber: 3,
    },
    {
      name: "Family Planning",
      code: "PMS 213",
      creditHours: 11.3,
      semesterNumber: 3,
    },

    // Year 2, Semester 2 (semesterNumber: 4)
    {
      name: "Sexual and Reproductive Health and Rights",
      code: "PMS 221",
      creditHours: 11.3,
      semesterNumber: 4,
    },
    {
      name: "Midwifery Care IV – Complications in Pregnancy",
      code: "PMS 222",
      creditHours: 18.6,
      semesterNumber: 4,
    },
    {
      name: "Child Health (Under 5)",
      code: "BMS 221",
      creditHours: 12.6,
      semesterNumber: 4,
    },
    {
      name: "Introduction to Research",
      code: "GS 221",
      creditHours: 5.3,
      semesterNumber: 4,
    },
    { name: "Seminar", code: "PMS 223", creditHours: 3.3, semesterNumber: 4 },

    // Year 3, Semester 1 (semesterNumber: 5)
    {
      name: "Midwifery in Community I (incl. Boma Health Initiative)",
      code: "PMS 311",
      creditHours: 12,
      semesterNumber: 5,
    },
    {
      name: "Midwifery Care V – Complications in Labour, Delivery and Puerperium",
      code: "PMS 312",
      creditHours: 18,
      semesterNumber: 5,
    },
    {
      name: "Complications in the Neonate",
      code: "PMS 313",
      creditHours: 6.6,
      semesterNumber: 5,
    },
    {
      name: "Gynecology",
      code: "PMS 314",
      creditHours: 9.3,
      semesterNumber: 5,
    },
    {
      name: "Research Project I",
      code: "PMS 315",
      creditHours: 5.3,
      semesterNumber: 5,
    },

    // Year 3, Semester 2 (semesterNumber: 6)
    {
      name: "Sexual and Reproductive Health and Rights incl. CMR",
      code: "PMS 321",
      creditHours: 17.3,
      semesterNumber: 6,
    },
    {
      name: "Midwifery in Community II incl. MISP",
      code: "PMS 322",
      creditHours: 12.6,
      semesterNumber: 6,
    },
    {
      name: "Principles of Management and Leadership",
      code: "GS 311",
      creditHours: 5.3,
      semesterNumber: 6,
    },
    {
      name: "Teaching Methodologies",
      code: "GS 312",
      creditHours: 3.3,
      semesterNumber: 6,
    },
    {
      name: "Research Project II",
      code: "PMS 324",
      creditHours: 8.6,
      semesterNumber: 6,
    },
  ];

  const allSubjects = [
    ...nursingSubjects.map((s) => ({ ...s, programId: nursingProgram.id })),
    ...midwiferySubjects.map((s) => ({ ...s, programId: midwiferyProgram.id })),
  ];

  await prisma.subject.createMany({
    data: allSubjects,
    skipDuplicates: true,
  });

  console.log(
    `✅ Created ${allSubjects.length} subjects (${nursingSubjects.length} Nursing, ${midwiferySubjects.length} Midwifery)`,
  );

  // ===========================
  // 4. Academic Year & Semesters
  // ===========================
  const academicYear = await prisma.academicYear.upsert({
    where: { name: "2025/2026" },
    update: {},
    create: {
      name: "2025/2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-07-31"),
      isCurrent: true,
    },
  });

  const semester1 = await prisma.semester.upsert({
    where: {
      academicYearId_name: {
        academicYearId: academicYear.id,
        name: "Semester 1",
      },
    },
    update: {},
    create: {
      academicYearId: academicYear.id,
      name: "Semester 1",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-01-31"),
      isCurrent: true,
    },
  });

  await prisma.semester.upsert({
    where: {
      academicYearId_name: {
        academicYearId: academicYear.id,
        name: "Semester 2",
      },
    },
    update: {},
    create: {
      academicYearId: academicYear.id,
      name: "Semester 2",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-07-31"),
      isCurrent: false,
    },
  });

  console.log("✅ Created academic year 2025/2026 with 2 semesters");

  // ===========================
  // 5. Super Admin User
  // ===========================
  const hashedPassword = await bcrypt.hash("PHSI@2025", 12);

  await prisma.user.upsert({
    where: { email: "admin@phsi.edu.ss" },
    update: {},
    create: {
      email: "admin@phsi.edu.ss",
      passwordHash: hashedPassword,
      role: "SUPER_ADMIN",
      fullName: "System Administrator",
      phone: "+211900000000",
      securityQuestion: "What is the name of this institution?",
      securityAnswer: await bcrypt.hash("phsi", 12),
    },
  });

  console.log("✅ Created Super Admin (admin@phsi.edu.ss / PHSI@2025)");

  // ===========================
  // 6. Settings
  // ===========================
  const settingsData = [
    {
      key: "institution_name",
      value: "Presbyterian Health Science Institute",
      category: "institution",
    },
    { key: "institution_short_name", value: "PHSI", category: "institution" },
    {
      key: "institution_address",
      value: "Juba, South Sudan",
      category: "institution",
    },
    {
      key: "institution_phone",
      value: "+211920000000",
      category: "institution",
    },
    {
      key: "institution_email",
      value: "info@phsi.edu.ss",
      category: "institution",
    },
    {
      key: "institution_website",
      value: "https://phsi.edu.ss",
      category: "institution",
    },
    {
      key: "institution_motto",
      value: "Training Health Professionals for a Healthier South Sudan",
      category: "institution",
    },
    {
      key: "institution_vision",
      value:
        "To be a leading health sciences training institution in South Sudan and the East African region.",
      category: "institution",
    },
    {
      key: "institution_mission",
      value:
        "To train competent, compassionate, and ethical health professionals who will contribute to improving healthcare delivery in South Sudan.",
      category: "institution",
    },
    {
      key: "current_academic_year_id",
      value: academicYear.id,
      category: "academic",
    },
    { key: "current_semester_id", value: semester1.id, category: "academic" },
    { key: "attendance_threshold", value: "75", category: "academic" },
    { key: "max_credit_hours", value: "24", category: "academic" },
    { key: "ca_weight", value: "40", category: "academic" },
    { key: "exam_weight", value: "60", category: "academic" },
    {
      key: "grading_scale",
      value: JSON.stringify([
        { letter: "A", minScore: 80, maxScore: 100, gpaPoints: 4.0 },
        { letter: "B", minScore: 70, maxScore: 79, gpaPoints: 3.0 },
        { letter: "C", minScore: 60, maxScore: 69, gpaPoints: 2.0 },
        { letter: "D", minScore: 50, maxScore: 59, gpaPoints: 1.5 },
        { letter: "E", minScore: 0, maxScore: 49, gpaPoints: 1.0 },
      ]),
      category: "academic",
    },
    { key: "default_currency", value: "USD", category: "finance" },
    { key: "block_registration_unpaid", value: "true", category: "finance" },
    { key: "fee_payment_deadline_days", value: "30", category: "finance" },
  ];

  for (const setting of settingsData) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log(`✅ Created ${settingsData.length} settings`);

  console.log("\n🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
