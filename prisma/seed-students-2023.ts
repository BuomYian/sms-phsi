/**
 * One-time import: 2023 intake students (Nursing + Midwifery).
 * Run with: npx tsx prisma/seed-students-2023.ts
 *
 * - Exact admission numbers are used as given; no auto-generation.
 * - Email format: phsi.rn.23.001@phsi.edu.ss  /  phsi.rm.23.180@phsi.edu.ss
 * - Default password = admission number (student changes on first login).
 * - yearOfStudy = 3  (admitted 2023 → currently 2025/2026 = Year 3).
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// [fullName, admissionNo, gender]
type Row = [string, string, "MALE" | "FEMALE"];

const NURSING_2023: Row[] = [
  // Batch 1 – 001 to 018  (RN/23/010 is absent from official list)
  ["Nyalat Wechtour",          "PHSI/RN/23/001", "FEMALE"],
  ["Gatmai Gathak Malual",     "PHSI/RN/23/002", "FEMALE"],
  ["Nyamal Majok Lual",        "PHSI/RN/23/003", "FEMALE"],
  ["Nyaluak Reath Long",       "PHSI/RN/23/004", "FEMALE"],
  ["Awel Majok Chawal",        "PHSI/RN/23/005", "FEMALE"],
  ["Jimma Stephen",            "PHSI/RN/23/006", "MALE"  ],
  ["Nyagai Liah Majak",        "PHSI/RN/23/007", "FEMALE"],
  ["Nyamuch Gatwech Malual",   "PHSI/RN/23/008", "FEMALE"],
  ["Nyaluak Kuony Nyol",       "PHSI/RN/23/009", "FEMALE"],
  // 010 not on official list – skipped intentionally
  ["Nyekoang Thuok Gatluak",   "PHSI/RN/23/011", "FEMALE"],
  ["Nyadak Ngom Tut",          "PHSI/RN/23/012", "FEMALE"],
  ["John Jal Nguot",           "PHSI/RN/23/013", "MALE"  ],
  ["Nyadieng Gak Deng",        "PHSI/RN/23/014", "FEMALE"],
  ["Rebecca Nyadholi Ruach",   "PHSI/RN/23/015", "FEMALE"],
  ["Nyandow Ruach Kun",        "PHSI/RN/23/016", "FEMALE"],
  ["Nyanhial Biel Deng",       "PHSI/RN/23/017", "FEMALE"],
  ["Nyaliep Jouy Tut",         "PHSI/RN/23/018", "FEMALE"],

  // Batch 2 – 019 to 038
  ["Aida Gilo Obang",          "PHSI/RN/23/019", "FEMALE"],
  ["Anna Stephen Pal Kang",    "PHSI/RN/23/020", "FEMALE"],
  ["Buma Michael Malow",       "PHSI/RN/23/021", "MALE"  ],
  ["Grace Nyangun Chot",       "PHSI/RN/23/022", "FEMALE"],
  ["Hannah Oman Agwa",         "PHSI/RN/23/023", "FEMALE"],
  ["Monday Marol Gany",        "PHSI/RN/23/024", "MALE"  ],
  ["Nyak Nyibol Nyang",        "PHSI/RN/23/025", "FEMALE"],
  ["Nyamal Gatkoi Liah",       "PHSI/RN/23/026", "FEMALE"],
  ["Nyareak Yoak Koat",        "PHSI/RN/23/027", "FEMALE"],
  ["Nyaruop Duoth Lam",        "PHSI/RN/23/028", "FEMALE"],
  ["Nyeboul James Ruach",      "PHSI/RN/23/029", "FEMALE"],
  ["Pia Guwo Mundwa",          "PHSI/RN/23/030", "FEMALE"],
  ["Racheal Nyamal Solomon",   "PHSI/RN/23/031", "FEMALE"],
  ["Refka Abdalla Tabir",      "PHSI/RN/23/032", "FEMALE"],
  ["Rhoda Nyamal Gatluak",     "PHSI/RN/23/033", "FEMALE"],
  ["Sarafina Nyamijok Othow",  "PHSI/RN/23/034", "FEMALE"],
  ["Teresa Nyaluji Ayei",      "PHSI/RN/23/035", "FEMALE"],
  ["Winnie Gai Chetiem",       "PHSI/RN/23/036", "FEMALE"],
  ["Ziel William Gatluak",     "PHSI/RN/23/037", "MALE"  ],
  ["Sarah Nyaguande Puol",     "PHSI/RN/23/038", "FEMALE"],
];

const MIDWIFERY_2023: Row[] = [
  // 180 – 214
  ["Aballa Ochalla Okwaya",        "PHSI/RM/23/180", "FEMALE"],
  ["Deborah Nyaguande Lipjok",     "PHSI/RM/23/181", "FEMALE"],
  ["Deborah Nyaneng",              "PHSI/RM/23/182", "FEMALE"],
  ["Hannah Regetta Thomas",        "PHSI/RM/23/183", "FEMALE"],
  ["Jackline Amsal Sangur",        "PHSI/RM/23/184", "FEMALE"],
  ["Josephine Labeng Aldo",        "PHSI/RM/23/185", "FEMALE"],
  ["Meer Peter Pal Chuol",         "PHSI/RM/23/186", "MALE"  ],
  ["Nyadame Peter",                "PHSI/RM/23/187", "FEMALE"],
  ["Nyadholi Elijah Padoch",       "PHSI/RM/23/188", "FEMALE"],
  ["Nyaduol Tut Tuong",            "PHSI/RM/23/189", "FEMALE"],
  ["Nyakache Bidong Mut",          "PHSI/RM/23/190", "FEMALE"],
  ["Nyakaiya Doriey Gai",          "PHSI/RM/23/191", "FEMALE"],
  ["Nyakandey Gatwang Riak",       "PHSI/RM/23/192", "FEMALE"],
  ["Nyakong Chok Chuol Kong",      "PHSI/RM/23/193", "FEMALE"],
  ["Nyakuoth Wang Wechtuor",       "PHSI/RM/23/194", "FEMALE"],
  ["Nyalat Gatbel Puot",           "PHSI/RM/23/195", "FEMALE"],
  ["Nyakuoth Gatchuk Riek",        "PHSI/RM/23/196", "FEMALE"],
  ["Nyamiri John Kutei",           "PHSI/RM/23/197", "FEMALE"],
  ["Nyanhial Jal Chuol",           "PHSI/RM/23/198", "FEMALE"],
  ["Nyaniet Thuoy Tot",            "PHSI/RM/23/199", "FEMALE"],
  ["Nyanyoach William Tut Diet",   "PHSI/RM/23/200", "FEMALE"],
  ["Nyapan Gideon Tai",            "PHSI/RM/23/201", "FEMALE"],
  ["Nyareak Wal Ruot",             "PHSI/RM/23/202", "FEMALE"],
  ["Nyareath Nyang Kher",          "PHSI/RM/23/203", "FEMALE"],
  ["Nyariek Peter Nyuong",         "PHSI/RM/23/204", "FEMALE"],
  ["Nyaruot Pajock Ruop",          "PHSI/RM/23/205", "FEMALE"],
  ["Nyasbit Peter Gatkuoth",       "PHSI/RM/23/206", "FEMALE"],
  ["Nyayian Loang Diet",           "PHSI/RM/23/207", "FEMALE"],
  ["Chol Tut Tiat",                "PHSI/RM/23/208", "MALE"  ],
  ["Tabitha Nyapieri Chuol",       "PHSI/RM/23/209", "FEMALE"],
  ["Veronica Ateng Garang",        "PHSI/RM/23/210", "FEMALE"],
  ["Anna Nyabany Gatdet",          "PHSI/RM/23/211", "FEMALE"],
  ["Ninagu Mary Samuel",           "PHSI/RM/23/212", "FEMALE"],
  ["Nyajuok Kuey Mayian",          "PHSI/RM/23/213", "FEMALE"],
  ["Nyekuoth Andrew Gatwech",      "PHSI/RM/23/214", "FEMALE"],
];

function admissionNoToEmail(admissionNo: string): string {
  // PHSI/RN/23/001 → phsi.rn.23.001@phsi.edu.ss
  return admissionNo.toLowerCase().replace(/\//g, ".") + "@phsi.edu.ss";
}

async function importBatch(
  rows: Row[],
  programId: string,
  programLabel: string,
) {
  let ok = 0;
  let skipped = 0;

  for (const [fullName, admissionNo, gender] of rows) {
    const email = admissionNoToEmail(admissionNo);

    // Skip if admission number already exists
    const existing = await prisma.student.findUnique({
      where: { studentIdNumber: admissionNo },
    });
    if (existing) {
      console.log(`  ⏭  ${admissionNo} already exists — skipped`);
      skipped++;
      continue;
    }

    const passwordHash = await bcrypt.hash(admissionNo, 12);
    const securityAnswerHash = await bcrypt.hash("phsi", 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: "STUDENT",
          fullName,
          securityQuestion: "What is the name of this institution?",
          securityAnswer: securityAnswerHash,
        },
      });

      await tx.student.create({
        data: {
          userId: user.id,
          studentIdNumber: admissionNo,
          programId,
          admissionDate: new Date("2023-09-01"),
          yearOfStudy: 3,
          gender: gender as "MALE" | "FEMALE",
          dob: new Date("2000-01-01"), // placeholder — update via profile
          nationality: "South Sudanese",
          admissionType: "REGULAR",
        },
      });
    });

    console.log(`  ✅ ${admissionNo}  ${fullName}`);
    ok++;
  }

  console.log(`\n${programLabel}: ${ok} imported, ${skipped} skipped.\n`);
}

async function main() {
  console.log("🎓 Importing 2023 intake students...\n");

  const nursingProgram = await prisma.program.findUnique({
    where: { code: "DIP-NUR" },
  });
  const midwiferyProgram = await prisma.program.findUnique({
    where: { code: "DIP-MID" },
  });

  if (!nursingProgram) throw new Error("Nursing program (DIP-NUR) not found");
  if (!midwiferyProgram) throw new Error("Midwifery program (DIP-MID) not found");

  console.log("── Nursing ──────────────────────────────────");
  await importBatch(NURSING_2023, nursingProgram.id, "Nursing");

  console.log("── Midwifery ────────────────────────────────");
  await importBatch(MIDWIFERY_2023, midwiferyProgram.id, "Midwifery");

  const total = await prisma.student.count();
  console.log(`\n🎉 Done. Total students in database: ${total}`);
  console.log("\nNote: Date of birth is set to 2000-01-01 as a placeholder.");
  console.log("      Update via student edit page or bulk update if needed.");
  console.log("      Default password = admission number (e.g. PHSI/RN/23/001).");
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
