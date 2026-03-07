import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

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
      where: { name: "Clinical Medicine" },
      update: {},
      create: { name: "Clinical Medicine", code: "CLM" },
    }),
    prisma.department.upsert({
      where: { name: "Public Health" },
      update: {},
      create: { name: "Public Health", code: "PBH" },
    }),
    prisma.department.upsert({
      where: { name: "Pharmacy" },
      update: {},
      create: { name: "Pharmacy", code: "PHR" },
    }),
    prisma.department.upsert({
      where: { name: "Laboratory Technology" },
      update: {},
      create: { name: "Laboratory Technology", code: "LAB" },
    }),
    prisma.department.upsert({
      where: { name: "Administration" },
      update: {},
      create: { name: "Administration", code: "ADM" },
    }),
  ]);

  console.log(`✅ Created ${departments.length} departments`);

  const [
    nursing,
    midwifery,
    clinicalMedicine,
    publicHealth,
    pharmacy,
    labTech,
  ] = departments;

  // ===========================
  // 2. Programs
  // ===========================
  const programs = await Promise.all([
    prisma.program.upsert({
      where: { code: "DIP-NUR" },
      update: {},
      create: {
        name: "Diploma in Nursing",
        code: "DIP-NUR",
        durationSemesters: 6,
        totalCredits: 120,
        departmentId: nursing.id,
        description:
          "A comprehensive diploma program training professional nurses for healthcare delivery in South Sudan.",
        entryRequirements:
          "South Sudan Certificate of Secondary Education (SSCSE) or equivalent with credits in Biology, Chemistry, English, and Mathematics.",
      },
    }),
    prisma.program.upsert({
      where: { code: "CERT-MID" },
      update: {},
      create: {
        name: "Certificate in Midwifery",
        code: "CERT-MID",
        durationSemesters: 4,
        totalCredits: 80,
        departmentId: midwifery.id,
        description:
          "A certificate program training skilled midwives for maternal and child health services.",
        entryRequirements:
          "SSCSE or equivalent with credits in Biology and English. Registered Nurse certificate preferred.",
      },
    }),
    prisma.program.upsert({
      where: { code: "DIP-CLM" },
      update: {},
      create: {
        name: "Diploma in Clinical Medicine",
        code: "DIP-CLM",
        durationSemesters: 6,
        totalCredits: 130,
        departmentId: clinicalMedicine.id,
        description:
          "A diploma program training clinical officers for primary healthcare delivery.",
        entryRequirements:
          "SSCSE or equivalent with credits in Biology, Chemistry, Physics, English, and Mathematics.",
      },
    }),
    prisma.program.upsert({
      where: { code: "DIP-PBH" },
      update: {},
      create: {
        name: "Diploma in Public Health",
        code: "DIP-PBH",
        durationSemesters: 6,
        totalCredits: 110,
        departmentId: publicHealth.id,
        description:
          "A diploma program training public health professionals for community health management.",
        entryRequirements:
          "SSCSE or equivalent with credits in Biology, English, and Mathematics.",
      },
    }),
    prisma.program.upsert({
      where: { code: "CERT-PHR" },
      update: {},
      create: {
        name: "Certificate in Pharmacy",
        code: "CERT-PHR",
        durationSemesters: 4,
        totalCredits: 85,
        departmentId: pharmacy.id,
        description:
          "A certificate program training pharmacy technicians for pharmaceutical services.",
        entryRequirements:
          "SSCSE or equivalent with credits in Chemistry, Biology, English, and Mathematics.",
      },
    }),
    prisma.program.upsert({
      where: { code: "CERT-LAB" },
      update: {},
      create: {
        name: "Certificate in Laboratory Technology",
        code: "CERT-LAB",
        durationSemesters: 4,
        totalCredits: 85,
        departmentId: labTech.id,
        description:
          "A certificate program training medical laboratory technicians for diagnostic services.",
        entryRequirements:
          "SSCSE or equivalent with credits in Biology, Chemistry, Physics, and Mathematics.",
      },
    }),
  ]);

  console.log(`✅ Created ${programs.length} programs`);

  // ===========================
  // 3. Subjects (5+ per program)
  // ===========================
  const subjectsData = [
    // Nursing - Semester 1
    {
      name: "Anatomy & Physiology I",
      code: "NUR-101",
      creditHours: 4,
      programId: programs[0].id,
      semesterNumber: 1,
    },
    {
      name: "Fundamentals of Nursing",
      code: "NUR-102",
      creditHours: 4,
      programId: programs[0].id,
      semesterNumber: 1,
    },
    {
      name: "Medical Biochemistry",
      code: "NUR-103",
      creditHours: 3,
      programId: programs[0].id,
      semesterNumber: 1,
    },
    {
      name: "Microbiology",
      code: "NUR-104",
      creditHours: 3,
      programId: programs[0].id,
      semesterNumber: 1,
    },
    {
      name: "English for Health Professionals",
      code: "NUR-105",
      creditHours: 2,
      programId: programs[0].id,
      semesterNumber: 1,
    },
    // Nursing - Semester 2
    {
      name: "Anatomy & Physiology II",
      code: "NUR-201",
      creditHours: 4,
      programId: programs[0].id,
      semesterNumber: 2,
    },
    {
      name: "Medical-Surgical Nursing I",
      code: "NUR-202",
      creditHours: 4,
      programId: programs[0].id,
      semesterNumber: 2,
    },
    {
      name: "Pharmacology I",
      code: "NUR-203",
      creditHours: 3,
      programId: programs[0].id,
      semesterNumber: 2,
    },

    // Midwifery - Semester 1
    {
      name: "Anatomy & Physiology",
      code: "MID-101",
      creditHours: 4,
      programId: programs[1].id,
      semesterNumber: 1,
    },
    {
      name: "Fundamentals of Midwifery",
      code: "MID-102",
      creditHours: 4,
      programId: programs[1].id,
      semesterNumber: 1,
    },
    {
      name: "Reproductive Health",
      code: "MID-103",
      creditHours: 3,
      programId: programs[1].id,
      semesterNumber: 1,
    },
    {
      name: "Nutrition & Dietetics",
      code: "MID-104",
      creditHours: 2,
      programId: programs[1].id,
      semesterNumber: 1,
    },
    {
      name: "Communication Skills",
      code: "MID-105",
      creditHours: 2,
      programId: programs[1].id,
      semesterNumber: 1,
    },
    // Midwifery - Semester 2
    {
      name: "Antenatal Care",
      code: "MID-201",
      creditHours: 4,
      programId: programs[1].id,
      semesterNumber: 2,
    },
    {
      name: "Labour & Delivery Management",
      code: "MID-202",
      creditHours: 4,
      programId: programs[1].id,
      semesterNumber: 2,
    },

    // Clinical Medicine - Semester 1
    {
      name: "Human Anatomy",
      code: "CLM-101",
      creditHours: 4,
      programId: programs[2].id,
      semesterNumber: 1,
    },
    {
      name: "Human Physiology",
      code: "CLM-102",
      creditHours: 4,
      programId: programs[2].id,
      semesterNumber: 1,
    },
    {
      name: "Biochemistry",
      code: "CLM-103",
      creditHours: 3,
      programId: programs[2].id,
      semesterNumber: 1,
    },
    {
      name: "Clinical Pathology",
      code: "CLM-104",
      creditHours: 3,
      programId: programs[2].id,
      semesterNumber: 1,
    },
    {
      name: "Introduction to Clinical Medicine",
      code: "CLM-105",
      creditHours: 3,
      programId: programs[2].id,
      semesterNumber: 1,
    },
    // Clinical Medicine - Semester 2
    {
      name: "Internal Medicine I",
      code: "CLM-201",
      creditHours: 4,
      programId: programs[2].id,
      semesterNumber: 2,
    },
    {
      name: "Surgery I",
      code: "CLM-202",
      creditHours: 4,
      programId: programs[2].id,
      semesterNumber: 2,
    },

    // Public Health - Semester 1
    {
      name: "Introduction to Public Health",
      code: "PBH-101",
      creditHours: 3,
      programId: programs[3].id,
      semesterNumber: 1,
    },
    {
      name: "Epidemiology I",
      code: "PBH-102",
      creditHours: 3,
      programId: programs[3].id,
      semesterNumber: 1,
    },
    {
      name: "Biostatistics",
      code: "PBH-103",
      creditHours: 3,
      programId: programs[3].id,
      semesterNumber: 1,
    },
    {
      name: "Environmental Health",
      code: "PBH-104",
      creditHours: 3,
      programId: programs[3].id,
      semesterNumber: 1,
    },
    {
      name: "Health Education & Promotion",
      code: "PBH-105",
      creditHours: 3,
      programId: programs[3].id,
      semesterNumber: 1,
    },
    // Public Health - Semester 2
    {
      name: "Epidemiology II",
      code: "PBH-201",
      creditHours: 3,
      programId: programs[3].id,
      semesterNumber: 2,
    },
    {
      name: "Community Health Nursing",
      code: "PBH-202",
      creditHours: 3,
      programId: programs[3].id,
      semesterNumber: 2,
    },

    // Pharmacy - Semester 1
    {
      name: "Pharmaceutical Chemistry",
      code: "PHR-101",
      creditHours: 4,
      programId: programs[4].id,
      semesterNumber: 1,
    },
    {
      name: "Pharmacognosy",
      code: "PHR-102",
      creditHours: 3,
      programId: programs[4].id,
      semesterNumber: 1,
    },
    {
      name: "Pharmacy Practice",
      code: "PHR-103",
      creditHours: 3,
      programId: programs[4].id,
      semesterNumber: 1,
    },
    {
      name: "Dispensing & Compounding",
      code: "PHR-104",
      creditHours: 3,
      programId: programs[4].id,
      semesterNumber: 1,
    },
    {
      name: "Pharmaceutical Calculations",
      code: "PHR-105",
      creditHours: 2,
      programId: programs[4].id,
      semesterNumber: 1,
    },

    // Lab Technology - Semester 1
    {
      name: "Introduction to Laboratory Science",
      code: "LAB-101",
      creditHours: 3,
      programId: programs[5].id,
      semesterNumber: 1,
    },
    {
      name: "Clinical Chemistry",
      code: "LAB-102",
      creditHours: 4,
      programId: programs[5].id,
      semesterNumber: 1,
    },
    {
      name: "Haematology",
      code: "LAB-103",
      creditHours: 4,
      programId: programs[5].id,
      semesterNumber: 1,
    },
    {
      name: "Medical Microbiology",
      code: "LAB-104",
      creditHours: 3,
      programId: programs[5].id,
      semesterNumber: 1,
    },
    {
      name: "Parasitology",
      code: "LAB-105",
      creditHours: 3,
      programId: programs[5].id,
      semesterNumber: 1,
    },
  ];

  for (const subject of subjectsData) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: {},
      create: subject,
    });
  }

  console.log(`✅ Created ${subjectsData.length} subjects`);

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
        { letter: "A", minScore: 70, maxScore: 100, gpaPoints: 4.0 },
        { letter: "B+", minScore: 65, maxScore: 69, gpaPoints: 3.5 },
        { letter: "B", minScore: 60, maxScore: 64, gpaPoints: 3.0 },
        { letter: "C+", minScore: 55, maxScore: 59, gpaPoints: 2.5 },
        { letter: "C", minScore: 50, maxScore: 54, gpaPoints: 2.0 },
        { letter: "D", minScore: 45, maxScore: 49, gpaPoints: 1.5 },
        { letter: "F", minScore: 0, maxScore: 44, gpaPoints: 0.0 },
      ]),
      category: "academic",
    },
    { key: "default_currency", value: "SSP", category: "finance" },
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
