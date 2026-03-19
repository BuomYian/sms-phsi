"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type ClassActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function createClassAction(
  _prevState: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role))
    return { error: "Unauthorized" };

  const programId = formData.get("programId") as string;
  const academicYearId = formData.get("academicYearId") as string;
  const yearLevel = Number(formData.get("yearLevel"));

  if (!programId || !academicYearId || !yearLevel) {
    return { error: "All fields are required." };
  }

  try {
    const [program, academicYear] = await Promise.all([
      db.program.findUnique({ where: { id: programId } }),
      db.academicYear.findUnique({ where: { id: academicYearId } }),
    ]);

    if (!program || !academicYear) {
      return { error: "Invalid program or academic year." };
    }

    const name = `Year ${yearLevel} ${program.name} ${academicYear.name}`;

    const cls = await db.academicClass.create({
      data: { name, programId, academicYearId, yearLevel },
    });

    await logAction(session.id, "CREATE", "Class", cls.id, {
      name,
      programId,
      academicYearId,
      yearLevel,
    });

    revalidatePath("/academics/classes");
    return { success: true, message: `Class "${name}" created.` };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { error: "This class already exists." };
    }
    console.error("Create class error:", error);
    return { error: "Failed to create class." };
  }
}

// Enroll students into a class — auto-creates Enrollment + CourseEnrollments
export async function enrollStudentsInClassAction(
  classId: string,
  studentIds: string[],
): Promise<ClassActionState> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role))
    return { error: "Unauthorized" };

  if (studentIds.length === 0) {
    return { error: "Select at least one student." };
  }

  try {
    const cls = await db.academicClass.findUnique({
      where: { id: classId },
      include: {
        program: true,
        academicYear: {
          include: {
            semesters: { orderBy: { startDate: "asc" } },
          },
        },
      },
    });
    if (!cls) return { error: "Class not found." };

    // Calculate which semester numbers belong to this year level
    // Year 1 = semesters 1-2, Year 2 = semesters 3-4, Year 3 = semesters 5-6
    const semStart = (cls.yearLevel - 1) * 2 + 1;
    const semEnd = cls.yearLevel * 2;

    // Get subjects for this program and year level
    const subjects = await db.subject.findMany({
      where: {
        programId: cls.programId,
        semesterNumber: { gte: semStart, lte: semEnd },
      },
    });

    // Get calendar semesters ordered (Semester 1 and Semester 2 of this academic year)
    const calendarSemesters = cls.academicYear.semesters;
    if (calendarSemesters.length === 0) {
      return {
        error:
          "No semesters found for this academic year. Create semesters first.",
      };
    }

    // Map: calendar semester index → subjects with matching semester number
    // calendarSemesters[0] → semStart subjects, calendarSemesters[1] → semEnd subjects
    const semesterSubjectMap: { semesterId: string; subjectIds: string[] }[] =
      [];
    for (let i = 0; i < calendarSemesters.length && i < 2; i++) {
      const targetSemNum = semStart + i;
      const semSubjects = subjects
        .filter((s) => s.semesterNumber === targetSemNum)
        .map((s) => s.id);
      if (semSubjects.length > 0) {
        semesterSubjectMap.push({
          semesterId: calendarSemesters[i].id,
          subjectIds: semSubjects,
        });
      }
    }

    let enrolledCount = 0;
    let skippedCount = 0;

    // Pre-fetch existing class students and enrollments outside the transaction
    const existingClassStudents = await db.classStudent.findMany({
      where: { classId, studentId: { in: studentIds } },
      select: { studentId: true },
    });
    const existingStudentSet = new Set(
      existingClassStudents.map((cs) => cs.studentId),
    );

    const newStudentIds = studentIds.filter(
      (id) => !existingStudentSet.has(id),
    );
    skippedCount = studentIds.length - newStudentIds.length;

    if (newStudentIds.length === 0) {
      return {
        success: true,
        message: `All ${skippedCount} student(s) were already enrolled.`,
      };
    }

    // Pre-fetch existing enrollments for these students in relevant semesters
    const semesterIds = semesterSubjectMap.map((s) => s.semesterId);
    const existingEnrollments = await db.enrollment.findMany({
      where: {
        studentId: { in: newStudentIds },
        semesterId: { in: semesterIds },
      },
      select: { studentId: true, semesterId: true },
    });
    const existingEnrollmentSet = new Set(
      existingEnrollments.map((e) => `${e.studentId}:${e.semesterId}`),
    );

    // Step 1: Batch create ClassStudent records
    await db.classStudent.createMany({
      data: newStudentIds.map((studentId) => ({ classId, studentId })),
      skipDuplicates: true,
    });

    // Step 2: Create enrollments one at a time (no transaction — idempotent)
    const enrollmentPairs: {
      studentId: string;
      semesterId: string;
      subjectIds: string[];
    }[] = [];
    for (const studentId of newStudentIds) {
      for (const { semesterId, subjectIds } of semesterSubjectMap) {
        if (!existingEnrollmentSet.has(`${studentId}:${semesterId}`)) {
          enrollmentPairs.push({ studentId, semesterId, subjectIds });
        }
      }
    }

    // Process in small batches to avoid overwhelming the connection
    const BATCH_SIZE = 5;
    for (let i = 0; i < enrollmentPairs.length; i += BATCH_SIZE) {
      const batch = enrollmentPairs.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(({ studentId, semesterId, subjectIds }) =>
          db.enrollment.create({
            data: {
              studentId,
              semesterId,
              classId,
              status: "APPROVED",
              approvedBy: session.id,
              approvedDate: new Date(),
              courseEnrollments: {
                create: subjectIds.map((subjectId) => ({ subjectId })),
              },
            },
          }),
        ),
      );
    }

    // Step 3: Batch update year of study
    await db.student.updateMany({
      where: { id: { in: newStudentIds } },
      data: { yearOfStudy: cls.yearLevel },
    });

    enrolledCount = newStudentIds.length;

    await logAction(session.id, "CREATE", "ClassEnrollment", classId, {
      enrolled: enrolledCount,
      skipped: skippedCount,
      totalSubjects: subjects.length,
    });

    revalidatePath(`/academics/classes/${classId}`);
    revalidatePath("/enrollment");
    return {
      success: true,
      message: `Enrolled ${enrolledCount} student(s) into ${cls.name}. ${skippedCount > 0 ? `${skippedCount} already enrolled.` : ""}`,
    };
  } catch (error) {
    console.error("Enroll students error:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to enroll students.";
    return { error: msg };
  }
}

export async function removeStudentFromClassAction(
  classStudentId: string,
  classId: string,
): Promise<ClassActionState> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role))
    return { error: "Unauthorized" };

  try {
    await db.classStudent.delete({ where: { id: classStudentId } });

    await logAction(session.id, "DELETE", "ClassStudent", classStudentId, {
      classId,
    });

    revalidatePath(`/academics/classes/${classId}`);
    return { success: true, message: "Student removed from class." };
  } catch (error) {
    console.error("Remove student error:", error);
    return { error: "Failed to remove student from class." };
  }
}

// Promote passing students to the next year level
export async function promoteStudentsAction(
  classId: string,
  studentIds: string[],
): Promise<ClassActionState> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role))
    return { error: "Unauthorized" };

  if (studentIds.length === 0) {
    return { error: "Select at least one student." };
  }

  try {
    const cls = await db.academicClass.findUnique({
      where: { id: classId },
      include: { program: true, academicYear: true },
    });
    if (!cls) return { error: "Class not found." };

    const maxYears = Math.ceil(cls.program.durationSemesters / 2);
    const nextYear = cls.yearLevel + 1;

    if (nextYear > maxYears) {
      // Graduating — mark students as GRADUATED
      await db.$transaction(async (tx) => {
        for (const studentId of studentIds) {
          await tx.classStudent.updateMany({
            where: { classId, studentId },
            data: { status: "COMPLETED" },
          });
          await tx.student.update({
            where: { id: studentId },
            data: { status: "GRADUATED" },
          });
        }
      });

      await logAction(session.id, "UPDATE", "ClassPromotion", classId, {
        action: "graduated",
        count: studentIds.length,
      });

      revalidatePath(`/academics/classes/${classId}`);
      return {
        success: true,
        message: `${studentIds.length} student(s) marked as graduated.`,
      };
    }

    // Find or get the next academic year
    const nextAY = await db.academicYear.findFirst({
      where: {
        startDate: { gt: cls.academicYear.endDate },
      },
      orderBy: { startDate: "asc" },
    });

    if (!nextAY) {
      return {
        error:
          "No next academic year found. Create the next academic year first.",
      };
    }

    // Find or create the next class
    let nextClass = await db.academicClass.findUnique({
      where: {
        programId_academicYearId_yearLevel: {
          programId: cls.programId,
          academicYearId: nextAY.id,
          yearLevel: nextYear,
        },
      },
    });

    if (!nextClass) {
      nextClass = await db.academicClass.create({
        data: {
          name: `Year ${nextYear} ${cls.program.name} ${nextAY.name}`,
          programId: cls.programId,
          academicYearId: nextAY.id,
          yearLevel: nextYear,
        },
      });
    }

    // Mark current class students as completed and add to next class
    await db.$transaction(async (tx) => {
      for (const studentId of studentIds) {
        await tx.classStudent.updateMany({
          where: { classId, studentId },
          data: { status: "COMPLETED" },
        });
        await tx.classStudent.create({
          data: { classId: nextClass.id, studentId },
        });
        await tx.student.update({
          where: { id: studentId },
          data: { yearOfStudy: nextYear },
        });
      }
    });

    await logAction(session.id, "UPDATE", "ClassPromotion", classId, {
      action: "promoted",
      count: studentIds.length,
      nextClassId: nextClass.id,
      nextYear,
    });

    revalidatePath(`/academics/classes/${classId}`);
    revalidatePath(`/academics/classes/${nextClass.id}`);
    revalidatePath("/academics/classes");
    return {
      success: true,
      message: `${studentIds.length} student(s) promoted to Year ${nextYear}. ${nextClass.name} class created.`,
    };
  } catch (error) {
    console.error("Promote students error:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to promote students.";
    return { error: msg };
  }
}

export async function deleteClassAction(
  classId: string,
): Promise<ClassActionState> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role))
    return { error: "Unauthorized" };

  try {
    const cls = await db.academicClass.findUnique({
      where: { id: classId },
      include: { _count: { select: { students: true } } },
    });
    if (!cls) return { error: "Class not found." };
    if (cls._count.students > 0) {
      return {
        error: "Cannot delete a class with enrolled students.",
      };
    }

    await db.academicClass.delete({ where: { id: classId } });

    await logAction(session.id, "DELETE", "Class", classId, {
      name: cls.name,
    });

    revalidatePath("/academics/classes");
    return { success: true, message: "Class deleted." };
  } catch (error) {
    console.error("Delete class error:", error);
    return { error: "Failed to delete class." };
  }
}
