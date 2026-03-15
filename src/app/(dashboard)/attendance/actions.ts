"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { AttendanceStatus } from "@prisma/client";

export type AttendanceActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function markAttendanceAction(
  _prevState: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const courseEnrollmentId = formData.get("courseEnrollmentId") as string;
  const date = formData.get("date") as string;
  const status = formData.get("status") as string;

  if (!courseEnrollmentId || !date || !status) {
    return { error: "Missing required fields." };
  }

  try {
    await db.attendance.upsert({
      where: {
        courseEnrollmentId_date: {
          courseEnrollmentId,
          date: new Date(date),
        },
      },
      update: { status: status as AttendanceStatus, markedBy: session.id },
      create: {
        courseEnrollmentId,
        date: new Date(date),
        status: status as AttendanceStatus,
        markedBy: session.id,
      },
    });

    await logAction(session.id, "CREATE", "Attendance", courseEnrollmentId, {
      date,
      status,
    });

    revalidatePath("/attendance");
    return { success: true, message: "Attendance recorded." };
  } catch (error) {
    console.error("Mark attendance error:", error);
    return { error: "Failed to record attendance." };
  }
}

export async function bulkMarkAttendanceAction(
  records: {
    courseEnrollmentId: string;
    date: string;
    status: string;
  }[],
): Promise<AttendanceActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  if (records.length === 0) {
    return { error: "No records to save." };
  }

  try {
    await db.$transaction(
      records.map((record) =>
        db.attendance.upsert({
          where: {
            courseEnrollmentId_date: {
              courseEnrollmentId: record.courseEnrollmentId,
              date: new Date(record.date),
            },
          },
          update: {
            status: record.status as AttendanceStatus,
            markedBy: session.id,
          },
          create: {
            courseEnrollmentId: record.courseEnrollmentId,
            date: new Date(record.date),
            status: record.status as AttendanceStatus,
            markedBy: session.id,
          },
        }),
      ),
    );

    await logAction(session.id, "CREATE", "Attendance", "bulk", {
      count: records.length,
    });

    revalidatePath("/attendance");
    return {
      success: true,
      message: `Attendance marked for ${records.length} student(s).`,
    };
  } catch (error) {
    console.error("Bulk attendance error:", error);
    return { error: "Failed to mark attendance." };
  }
}

export async function deleteAttendanceAction(
  attendanceId: string,
): Promise<AttendanceActionState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await db.attendance.delete({ where: { id: attendanceId } });

    await logAction(session.id, "DELETE", "Attendance", attendanceId);

    revalidatePath("/attendance");
    return { success: true, message: "Attendance record deleted." };
  } catch (error) {
    console.error("Delete attendance error:", error);
    return { error: "Failed to delete attendance record." };
  }
}
