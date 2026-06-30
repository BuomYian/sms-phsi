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

// Update class name
export async function updateClassAction(
  classId: string,
  _prevState: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role))
    return { error: "Unauthorized" };

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 2) {
    return { error: "Name must be at least 2 characters." };
  }

  try {
    const cls = await db.academicClass.findUnique({ where: { id: classId } });
    if (!cls) return { error: "Class not found." };

    await db.academicClass.update({
      where: { id: classId },
      data: { name },
    });

    await logAction(session.id, "UPDATE", "Class", classId, { name });

    revalidatePath(`/academics/classes/${classId}`);
    revalidatePath("/academics/classes");
    return { success: true, message: `Class renamed to "${name}".` };
  } catch (error) {
    console.error("Update class error:", error);
    return { error: "Failed to update class." };
  }
}

// Enroll students into a class — creates ClassStudent + Enrollment records only.
// CourseEnrollments are created when admin adds a SubjectOffering (see below).
export async function enrollStudentsInClassAction(
  classId: string,
  studentIds: string[],
): Promise<ClassActionState> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role))
    return { error: "Unauthorized" };

  if (studentIds.length === 0) return { error: "Select at least one student." };

  try {
    const cls = await db.academicClass.findUnique({
      where: { id: classId },
      include: {
        program: true,
        academicYear: {
          include: { semesters: { orderBy: { startDate: "asc" } } },
        },
      },
    });
    if (!cls) return { error: "Class not found." };

    const calendarSemesters = cls.academicYear.semesters;
    if (calendarSemesters.length === 0)
      return { error: "No semesters found for this academic year. Create semesters first." };

    // Skip already-enrolled students
    const existing = await db.classStudent.findMany({
      where: { classId, studentId: { in: studentIds } },
      select: { studentId: true },
    });
    const existingSet = new Set(existing.map((e) => e.studentId));
    const newIds = studentIds.filter((id) => !existingSet.has(id));
    const skipped = studentIds.length - newIds.length;

    if (newIds.length === 0)
      return { success: true, message: `All ${skipped} student(s) already enrolled.` };

    // 1. ClassStudent records
    await db.classStudent.createMany({
      data: newIds.map((studentId) => ({ classId, studentId })),
      skipDuplicates: true,
    });

    // 2. Enrollment records for each calendar semester (no CourseEnrollments yet)
    const semesterIds = calendarSemesters.map((s) => s.id);
    const existingEnrollments = await db.enrollment.findMany({
      where: { studentId: { in: newIds }, semesterId: { in: semesterIds } },
      select: { studentId: true, semesterId: true },
    });
    const enrolledSet = new Set(existingEnrollments.map((e) => `${e.studentId}:${e.semesterId}`));

    const enrollmentRows = newIds.flatMap((studentId) =>
      calendarSemesters
        .filter((s) => !enrolledSet.has(`${studentId}:${s.id}`))
        .map((s) => ({
          studentId,
          semesterId: s.id,
          classId,
          status: "APPROVED" as const,
          approvedBy: session.id,
          approvedDate: new Date(),
        })),
    );
    if (enrollmentRows.length > 0) {
      await db.enrollment.createMany({ data: enrollmentRows, skipDuplicates: true });
    }

    // 3. For any ACTIVE subject offerings already on this class, give new students CourseEnrollments
    const activeOfferings = await db.subjectOffering.findMany({
      where: { classId, status: "ACTIVE" },
      select: { subjectId: true, semesterId: true },
    });
    if (activeOfferings.length > 0) {
      const enrollments = await db.enrollment.findMany({
        where: { studentId: { in: newIds }, semesterId: { in: activeOfferings.map((o) => o.semesterId) } },
        select: { id: true, studentId: true, semesterId: true },
      });
      const courseRows = enrollments.flatMap((enr) =>
        activeOfferings
          .filter((o) => o.semesterId === enr.semesterId)
          .map((o) => ({ enrollmentId: enr.id, subjectId: o.subjectId })),
      );
      if (courseRows.length > 0)
        await db.courseEnrollment.createMany({ data: courseRows, skipDuplicates: true });
    }

    // 4. Update year of study
    await db.student.updateMany({
      where: { id: { in: newIds } },
      data: { yearOfStudy: cls.yearLevel },
    });

    // 5. Auto-assign fee structures
    let feesAssigned = 0;
    const feeStructures = await db.feeStructure.findMany({
      where: { programId: cls.programId, academicYearId: cls.academicYearId, semesterId: { in: semesterIds } },
    });
    if (feeStructures.length > 0) {
      const existingFees = await db.studentFee.findMany({
        where: { studentId: { in: newIds }, feeStructureId: { in: feeStructures.map((f) => f.id) } },
        select: { studentId: true, feeStructureId: true },
      });
      const existingFeeSet = new Set(existingFees.map((f) => `${f.studentId}:${f.feeStructureId}`));
      const now = new Date();
      for (const studentId of newIds) {
        const scholarship = await db.scholarship.findFirst({
          where: { studentId, startDate: { lte: now }, endDate: { gte: now } },
        });
        for (const fee of feeStructures) {
          if (existingFeeSet.has(`${studentId}:${fee.id}`)) continue;
          const amount = Number(fee.amount);
          let balance = amount;
          let status = "UNPAID";
          if (scholarship) {
            const discount = scholarship.percentage
              ? amount * (scholarship.percentage / 100)
              : Math.min(Number(scholarship.amount ?? 0), amount);
            balance = amount - discount;
            status = balance <= 0 ? "PAID" : "UNPAID";
          }
          await db.studentFee.create({
            data: { studentId, feeStructureId: fee.id, amountCharged: fee.amount, amountPaid: 0, balance, status },
          });
          feesAssigned++;
        }
      }
    }

    await logAction(session.id, "CREATE", "ClassEnrollment", classId, {
      enrolled: newIds.length, skipped, feesAssigned,
    });

    revalidatePath(`/academics/classes/${classId}`);
    revalidatePath("/enrollment");
    revalidatePath("/fees");
    return {
      success: true,
      message: `Enrolled ${newIds.length} student(s) into ${cls.name}${feesAssigned > 0 ? ` with ${feesAssigned} fee(s) assigned` : ""}. ${skipped > 0 ? `${skipped} already enrolled.` : ""}`,
    };
  } catch (error) {
    console.error("Enroll students error:", error);
    return { error: error instanceof Error ? error.message : "Failed to enroll students." };
  }
}

// ===========================
// SUBJECT OFFERINGS
// ===========================

export async function addSubjectOfferingAction(
  classId: string,
  subjectId: string,
  semesterId: string,
): Promise<ClassActionState> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role))
    return { error: "Unauthorized" };

  try {
    // Check not already offered to this class
    const existing = await db.subjectOffering.findUnique({
      where: { classId_subjectId: { classId, subjectId } },
    });
    if (existing)
      return { error: existing.status === "COMPLETED" ? "This subject has already been taught to this class." : "This subject is already an active offering." };

    // Create the offering
    const offering = await db.subjectOffering.create({
      data: { classId, subjectId, semesterId, createdBy: session.id },
      include: { subject: { select: { name: true } } },
    });

    // Create CourseEnrollments for all currently enrolled students in this semester
    const enrollments = await db.enrollment.findMany({
      where: { classId, semesterId },
      select: { id: true },
    });
    if (enrollments.length > 0) {
      await db.courseEnrollment.createMany({
        data: enrollments.map((e) => ({ enrollmentId: e.id, subjectId })),
        skipDuplicates: true,
      });
    }

    await logAction(session.id, "CREATE", "SubjectOffering", offering.id, {
      classId, subjectId, semesterId,
    });

    revalidatePath(`/academics/classes/${classId}`);
    return { success: true, message: `${offering.subject.name} added to offerings. ${enrollments.length} student(s) enrolled.` };
  } catch (error) {
    console.error("Add offering error:", error);
    return { error: "Failed to add subject offering." };
  }
}

export async function completeSubjectOfferingAction(
  offeringId: string,
  classId: string,
): Promise<ClassActionState> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role))
    return { error: "Unauthorized" };

  try {
    const offering = await db.subjectOffering.findUnique({
      where: { id: offeringId },
      include: { subject: { select: { name: true } } },
    });
    if (!offering) return { error: "Offering not found." };
    if (offering.status === "COMPLETED") return { error: "Already marked as completed." };

    await db.subjectOffering.update({
      where: { id: offeringId },
      data: { status: "COMPLETED" },
    });

    await logAction(session.id, "UPDATE", "SubjectOffering", offeringId, { status: "COMPLETED" });

    revalidatePath(`/academics/classes/${classId}`);
    return { success: true, message: `${offering.subject.name} marked as taught.` };
  } catch (error) {
    console.error("Complete offering error:", error);
    return { error: "Failed to update offering." };
  }
}

export async function removeSubjectOfferingAction(
  offeringId: string,
  classId: string,
): Promise<ClassActionState> {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role))
    return { error: "Unauthorized" };

  try {
    const offering = await db.subjectOffering.findUnique({
      where: { id: offeringId },
      include: {
        subject: {
          select: {
            name: true,
            courseEnrollments: {
              where: { grade: { isNot: null } },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });
    if (!offering) return { error: "Offering not found." };
    if (offering.status === "COMPLETED")
      return { error: "Cannot remove a completed offering. It is part of the academic record." };
    if (offering.subject.courseEnrollments.length > 0)
      return { error: "Cannot remove — grades have already been entered for this subject." };

    // Delete CourseEnrollments for this subject in this class's semester
    await db.courseEnrollment.deleteMany({
      where: {
        subjectId: offering.subjectId,
        enrollment: { classId },
      },
    });

    await db.subjectOffering.delete({ where: { id: offeringId } });

    await logAction(session.id, "DELETE", "SubjectOffering", offeringId, { classId });

    revalidatePath(`/academics/classes/${classId}`);
    return { success: true, message: `${offering.subject.name} removed from offerings.` };
  } catch (error) {
    console.error("Remove offering error:", error);
    return { error: "Failed to remove offering." };
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
