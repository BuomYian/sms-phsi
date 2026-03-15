import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM dd, yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "MMM dd, yyyy HH:mm");
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function generateStudentId(year: number, sequence: number): string {
  return `PHSI-${year}-${String(sequence).padStart(4, "0")}`;
}

export function generateStaffId(sequence: number): string {
  return `PHSI-STF-${String(sequence).padStart(4, "0")}`;
}

export function generateReceiptNumber(year: number, sequence: number): string {
  return `PHSI-RCT-${year}-${String(sequence).padStart(6, "0")}`;
}

export function calculateGPA(
  grades: { creditHours: number; gpaPoints: number }[],
): number {
  if (grades.length === 0) return 0;
  const totalCredits = grades.reduce((sum, g) => sum + g.creditHours, 0);
  if (totalCredits === 0) return 0;
  const totalPoints = grades.reduce(
    (sum, g) => sum + g.creditHours * g.gpaPoints,
    0,
  );
  return Math.round((totalPoints / totalCredits) * 100) / 100;
}

export function getGradeLetter(totalMarks: number): string {
  if (totalMarks >= 70) return "A";
  if (totalMarks >= 65) return "B+";
  if (totalMarks >= 60) return "B";
  if (totalMarks >= 55) return "C+";
  if (totalMarks >= 50) return "C";
  if (totalMarks >= 45) return "D";
  return "F";
}

export function getGPAPoints(gradeLetter: string): number {
  const scale: Record<string, number> = {
    A: 4.0,
    "B+": 3.5,
    B: 3.0,
    "C+": 2.5,
    C: 2.0,
    D: 1.5,
    F: 0.0,
  };
  return scale[gradeLetter] ?? 0;
}

export function getAttendancePercentage(
  present: number,
  late: number,
  total: number,
): number {
  if (total === 0) return 0;
  return Math.round(((present + late) / total) * 100);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
