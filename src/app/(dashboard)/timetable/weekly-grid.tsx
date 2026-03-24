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
    program?: { name: string; code: string } | null;
  };
  instructor: { user: { fullName: string } };
};

const TIME_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

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

export default function WeeklyGrid({
  entries,
  showProgram = false,
}: {
  entries: TimetableEntry[];
  showProgram?: boolean;
}) {
  const startOfDay = timeToMinutes("07:00");
  const endOfDay = timeToMinutes("18:00");
  const totalMinutes = endOfDay - startOfDay;

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
            {TIME_SLOTS.map((time) => (
              <div
                key={time}
                className="flex h-16 items-start justify-center border-b p-1 text-xs text-muted-foreground"
              >
                {time}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS_OF_WEEK.map((day, dayIndex) => (
            <div key={day} className="relative border-r last:border-r-0">
              {/* Background grid lines */}
              {TIME_SLOTS.map((time) => (
                <div key={time} className="h-16 border-b" />
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
                        {showProgram && entry.subject.program && (
                          <span className="font-normal opacity-70">
                            {" "}
                            ({entry.subject.program.code})
                          </span>
                        )}
                      </p>
                      <p className="truncate leading-tight opacity-80">
                        {entry.subject.name}
                      </p>
                      <p className="truncate leading-tight opacity-70">
                        {entry.instructor.user.fullName}
                      </p>
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
