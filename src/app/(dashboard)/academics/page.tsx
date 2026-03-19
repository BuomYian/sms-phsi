import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Library,
  Building2,
  CalendarDays,
  Users,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Academics" };

export default async function AcademicsPage() {
  const [programCount, subjectCount, departmentCount, classCount, currentAY] =
    await Promise.all([
      db.program.count({ where: { isActive: true } }),
      db.subject.count(),
      db.department.count(),
      db.academicClass.count(),
      db.academicYear.findFirst({ where: { isCurrent: true } }),
    ]);

  const cards = [
    {
      title: "Programs",
      count: programCount,
      description: "Manage academic programs and curricula",
      icon: Library,
      href: "/academics/programs",
    },
    {
      title: "Subjects",
      count: subjectCount,
      description: "Manage subjects and course offerings",
      icon: BookOpen,
      href: "/academics/subjects",
    },
    {
      title: "Departments",
      count: departmentCount,
      description: "Manage academic departments",
      icon: Building2,
      href: "/academics/departments",
    },
    {
      title: "Classes",
      count: classCount,
      description: "Manage year-level class cohorts",
      icon: Users,
      href: "/academics/classes",
    },
    {
      title: "Academic Calendar",
      count: null,
      description: currentAY
        ? `Current: ${currentAY.name}`
        : "No active academic year",
      icon: CalendarDays,
      href: "/academics/calendar",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Academics</h1>
        <p className="text-muted-foreground">
          Manage programs, subjects, departments, and academic calendar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {card.count !== null && (
                <p className="text-3xl font-bold">{card.count}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {card.description}
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href={card.href}>Manage →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
