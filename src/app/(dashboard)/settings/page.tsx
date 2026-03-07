import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  School,
  GraduationCap,
  DollarSign,
  UsersRound,
  ScrollText,
} from "lucide-react";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  const sections = [
    {
      title: "Institution",
      description: "Name, address, logo, and branding",
      icon: School,
      href: "/settings/institution",
    },
    {
      title: "Academic",
      description: "Grading scale, credit hours, attendance thresholds",
      icon: GraduationCap,
      href: "/settings/academic",
    },
    {
      title: "Fee Settings",
      description: "Currency, payment methods, late-fee policies",
      icon: DollarSign,
      href: "/settings/fees",
    },
    {
      title: "Users",
      description: "Manage system users and their roles",
      icon: UsersRound,
      href: "/settings/users",
    },
    {
      title: "Audit Log",
      description: "View all system activity logs",
      icon: ScrollText,
      href: "/settings/audit-log",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          System configuration and administration.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Card key={s.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {s.description}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href={s.href}>Configure →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
