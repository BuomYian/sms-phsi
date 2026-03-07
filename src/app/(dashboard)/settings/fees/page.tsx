import { db } from "@/lib/db";
import SettingsForm from "../institution/settings-form";

export const metadata = { title: "Fee Settings" };

export default async function FeeSettingsPage() {
  const settings = await db.setting.findMany({
    where: { category: "finance" },
    orderBy: { key: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fee Settings</h1>
        <p className="text-muted-foreground">
          Currency defaults, payment methods, and late-fee policies.
        </p>
      </div>
      <SettingsForm settings={settings} category="finance" />
    </div>
  );
}
