import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenLine, CheckCircle, Award, FileText, Calendar } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Grades & Exams" };

export default function GradesPage() {
  const sections = [
    {
      title: "Grade Entry",
      description: "Enter CA and exam scores for students",
      icon: PenLine,
      href: "/grades/enter",
    },
    {
      title: "Grade Review",
      description: "Review and approve submitted grades",
      icon: CheckCircle,
      href: "/grades/review",
    },
    {
      title: "My Results",
      description: "View your academic results",
      icon: Award,
      href: "/grades/my-results",
    },
    {
      title: "Transcripts",
      description: "Generate student transcripts",
      icon: FileText,
      href: "/grades/transcripts",
    },
    {
      title: "Exam Schedule",
      description: "View and manage exam timetable",
      icon: Calendar,
      href: "/grades/exams",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grades & Exams</h1>
        <p className="text-muted-foreground">
          Grade management, transcripts, and exam scheduling.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Card
            key={section.title}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <section.icon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {section.description}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href={section.href}>Open →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
