import { db } from "@/lib/db";
import SettingsForm from "../institution/settings-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Academic Settings" };

export default async function AcademicSettingsPage() {
  const settings = await db.setting.findMany({
    where: { category: "academic" },
    orderBy: { key: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Academic Settings
          </h1>
          <p className="text-muted-foreground">
            Grading scale, credit hours, and attendance thresholds.
          </p>
        </div>
      </div>
      <SettingsForm settings={settings} category="academic" />
    </div>
  );
}
