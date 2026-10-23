"use client";

import { DAYS_OF_WEEK } from "@/constants";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

type TimetableEntry = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  subject: {
    name: string;
    code: string;
  };
  /** Omitted where the viewer is the instructor — their own name adds nothing. */
  instructor?: { user: { fullName: string } } | null;
};

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 18;

const SLOT_COLORS = [
  "bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
  "bg-green-100 border-green-300 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
  "bg-purple-100 border-purple-300 text-purple-900 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-200",
  "bg-orange-100 border-orange-300 text-orange-900 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200",
  "bg-pink-100 border-pink-300 text-pink-900 dark:bg-pink-950 dark:border-pink-800 dark:text-pink-200",
  "bg-teal-100 border-teal-300 text-teal-900 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-200",
  "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200",
  "bg-cyan-100 border-cyan-300 text-cyan-900 dark:bg-cyan-950 dark:border-cyan-800 dark:text-cyan-200",
];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Bound the grid to the hours actually taught rather than a fixed 07:00–18:00
 * window, which otherwise renders several permanently empty rows.
 */
function hourRange(entries: { startTime: string; endTime: string }[]) {
  if (entries.length === 0) {
    return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  }
  let min = 24;
  let max = 0;
  for (const e of entries) {
    min = Math.min(min, Math.floor(timeToMinutes(e.startTime) / 60));
    max = Math.max(max, Math.ceil(timeToMinutes(e.endTime) / 60));
  }
  return { startHour: Math.max(0, min), endHour: Math.min(24, Math.max(max, min + 1)) };
}

export default function WeeklyGrid({
  entries,
  compact = false,
}: {
  entries: TimetableEntry[];
  /** Shorter rows, for embedding in a dashboard card. */
  compact?: boolean;
}) {
  const { startHour, endHour } = hourRange(entries);
  const timeSlots = Array.from({ length: endHour - startHour }, (_, i) =>
    `${String(startHour + i).padStart(2, "0")}:00`,
  );
  const startOfDay = startHour * 60;
  const endOfDay = endHour * 60;
  const totalMinutes = endOfDay - startOfDay;
  const rowHeight = compact ? "h-12" : "h-16";

  // Assign a consistent color per subject code
  const subjectColorMap = new Map<string, string>();
  const uniqueSubjects = [...new Set(entries.map((e) => e.subject.code))];
  uniqueSubjects.forEach((code, i) => {
    subjectColorMap.set(code, SLOT_COLORS[i % SLOT_COLORS.length]);
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="min-w-[800px]">
        {/* Header row */}
        <div className="grid grid-cols-[80px_repeat(6,1fr)] border-b bg-muted/50">
          <div className="border-r p-2 text-center text-xs font-medium text-muted-foreground">
            Time
          </div>
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="border-r p-2 text-center text-xs font-semibold last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="grid grid-cols-[80px_repeat(6,1fr)]">
          {/* Time column */}
          <div className="border-r">
            {timeSlots.map((time) => (
              <div
                key={time}
                className={cn(
                  "flex items-start justify-center border-b p-1 text-xs text-muted-foreground",
                  rowHeight,
                )}
              >
                {time}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS_OF_WEEK.map((day, dayIndex) => (
            <div key={day} className="relative border-r last:border-r-0">
              {/* Background grid lines */}
              {timeSlots.map((time) => (
                <div key={time} className={cn("border-b", rowHeight)} />
              ))}

              {/* Entries positioned absolutely */}
              {entries
                .filter((e) => e.dayOfWeek === dayIndex)
                .map((entry) => {
                  const startMin = timeToMinutes(entry.startTime) - startOfDay;
                  const endMin = timeToMinutes(entry.endTime) - startOfDay;
                  const top = (startMin / totalMinutes) * 100;
                  const height = ((endMin - startMin) / totalMinutes) * 100;
                  const colorClass =
                    subjectColorMap.get(entry.subject.code) ?? SLOT_COLORS[0];

                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        "absolute left-0.5 right-0.5 overflow-hidden rounded border px-1.5 py-1 text-xs",
                        colorClass,
                      )}
                      style={{
                        top: `${top}%`,
                        height: `${height}%`,
                        minHeight: "32px",
                      }}
                    >
                      <p className="font-semibold leading-tight truncate">
                        {entry.subject.code}
                      </p>
                      <p className="truncate leading-tight opacity-80">
                        {entry.subject.name}
                      </p>
                      {entry.instructor && (
                        <p className="truncate leading-tight opacity-70">
                          {entry.instructor.user.fullName}
                        </p>
                      )}
                      <p className="flex items-center gap-0.5 truncate leading-tight opacity-60">
                        <MapPin className="h-2.5 w-2.5" />
                        {entry.room}
                      </p>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
