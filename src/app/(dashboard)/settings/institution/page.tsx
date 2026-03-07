import { db } from "@/lib/db";
import SettingsForm from "./settings-form";

export const metadata = { title: "Institution Settings" };

export default async function InstitutionSettingsPage() {
  const settings = await db.setting.findMany({
    where: { category: "institution" },
    orderBy: { key: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Institution Settings
        </h1>
        <p className="text-muted-foreground">
          Configure institution name, address, and branding.
        </p>
      </div>
      <SettingsForm settings={settings} category="institution" />
    </div>
  );
}
