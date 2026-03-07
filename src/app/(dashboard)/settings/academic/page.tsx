import { db } from "@/lib/db";
import SettingsForm from "../institution/settings-form";

export const metadata = { title: "Academic Settings" };

export default async function AcademicSettingsPage() {
  const settings = await db.setting.findMany({
    where: { category: "academic" },
    orderBy: { key: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Academic Settings</h1>
        <p className="text-muted-foreground">
          Grading scale, credit hours, and attendance thresholds.
        </p>
      </div>
      <SettingsForm settings={settings} category="academic" />
    </div>
  );
}
