"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type TimetableActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function createTimetableEntryAction(
  _prevState: TimetableActionState,
  formData: FormData,
): Promise<TimetableActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const subjectId = formData.get("subjectId") as string;
  const instructorId = formData.get("instructorId") as string;
  const semesterId = formData.get("semesterId") as string;
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const room = formData.get("room") as string;

  if (
    !subjectId ||
    !instructorId ||
    !semesterId ||
    !startTime ||
    !endTime ||
    !room
  ) {
    return { error: "All fields are required." };
  }

  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 5) {
    return { error: "Invalid day of week." };
  }

  if (startTime >= endTime) {
    return { error: "End time must be after start time." };
  }

  try {
    // Check for time conflicts in the same room
    const roomConflict = await db.timetableEntry.findFirst({
      where: {
        semesterId,
        dayOfWeek,
        room,
        OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
      },
    });

    if (roomConflict) {
      return {
        error: `Room "${room}" is already booked at that time on this day.`,
      };
    }

    // Check for instructor conflicts
    const instructorConflict = await db.timetableEntry.findFirst({
      where: {
        semesterId,
        dayOfWeek,
        instructorId,
        OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
      },
    });

    if (instructorConflict) {
      return { error: "This instructor already has a class at that time." };
    }

    // Check for student schedule conflicts
    const studentsInSubject = await db.courseEnrollment.findMany({
      where: {
        subjectId,
        enrollment: { status: "APPROVED", semesterId },
      },
      select: {
        enrollment: {
          select: {
            student: {
              select: {
                user: { select: { fullName: true } },
              },
            },
            courseEnrollments: {
              select: { subjectId: true },
            },
          },
        },
      },
    });

    if (studentsInSubject.length > 0) {
      const otherSubjectIds = [
        ...new Set(
          studentsInSubject.flatMap((s) =>
            s.enrollment.courseEnrollments
              .map((ce) => ce.subjectId)
              .filter((id) => id !== subjectId),
          ),
        ),
      ];

      if (otherSubjectIds.length > 0) {
        const studentConflict = await db.timetableEntry.findFirst({
          where: {
            semesterId,
            dayOfWeek,
            subjectId: { in: otherSubjectIds },
            OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
          },
          include: { subject: { select: { name: true } } },
        });

        if (studentConflict) {
          return {
            error: `Student schedule conflict: overlaps with ${studentConflict.subject.name} at ${studentConflict.startTime}–${studentConflict.endTime}.`,
          };
        }
      }
    }

    const entry = await db.timetableEntry.create({
      data: {
        subjectId,
        instructorId,
        semesterId,
        dayOfWeek,
        startTime,
        endTime,
        room,
      },
    });

    await logAction(session.id, "CREATE", "TimetableEntry", entry.id, {
      subjectId,
      instructorId,
      dayOfWeek,
      startTime,
      endTime,
      room,
    });

    revalidatePath("/timetable");
    return { success: true, message: "Timetable entry created." };
  } catch (error) {
    console.error("Create timetable entry error:", error);
    return { error: "Failed to create timetable entry." };
  }
}

export async function updateTimetableEntryAction(
  entryId: string,
  _prevState: TimetableActionState,
  formData: FormData,
): Promise<TimetableActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const subjectId = formData.get("subjectId") as string;
  const instructorId = formData.get("instructorId") as string;
  const semesterId = formData.get("semesterId") as string;
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const room = formData.get("room") as string;

  if (
    !subjectId ||
    !instructorId ||
    !semesterId ||
    !startTime ||
    !endTime ||
    !room
  ) {
    return { error: "All fields are required." };
  }

  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 5) {
    return { error: "Invalid day of week." };
  }

  if (startTime >= endTime) {
    return { error: "End time must be after start time." };
  }

  try {
    // Check room conflict excluding self
    const roomConflict = await db.timetableEntry.findFirst({
      where: {
        id: { not: entryId },
        semesterId,
        dayOfWeek,
        room,
        OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
      },
    });

    if (roomConflict) {
      return {
        error: `Room "${room}" is already booked at that time on this day.`,
      };
    }

    // Check instructor conflict excluding self
    const instructorConflict = await db.timetableEntry.findFirst({
      where: {
        id: { not: entryId },
        semesterId,
        dayOfWeek,
        instructorId,
        OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
      },
    });

    if (instructorConflict) {
      return { error: "This instructor already has a class at that time." };
    }

    await db.timetableEntry.update({
      where: { id: entryId },
      data: {
        subjectId,
        instructorId,
        semesterId,
        dayOfWeek,
        startTime,
        endTime,
        room,
      },
    });

    await logAction(session.id, "UPDATE", "TimetableEntry", entryId, {
      subjectId,
      instructorId,
      dayOfWeek,
      startTime,
      endTime,
      room,
    });

    revalidatePath("/timetable");
    revalidatePath(`/timetable/${entryId}`);
    return { success: true, message: "Timetable entry updated." };
  } catch (error) {
    console.error("Update timetable entry error:", error);
    return { error: "Failed to update timetable entry." };
  }
}

export async function deleteTimetableEntryAction(
  entryId: string,
): Promise<TimetableActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await db.timetableEntry.delete({
      where: { id: entryId },
    });

    await logAction(session.id, "DELETE", "TimetableEntry", entryId);

    revalidatePath("/timetable");
    return { success: true, message: "Timetable entry deleted." };
  } catch (error) {
    console.error("Delete timetable entry error:", error);
    return { error: "Failed to delete timetable entry." };
  }
}
