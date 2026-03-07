import { db } from "@/lib/db";
import ComposeForm from "./compose-form";

export const metadata = { title: "Compose Message" };

export default async function ComposePage() {
  const users = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, fullName: true, email: true, role: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compose Message</h1>
        <p className="text-muted-foreground">
          Send a direct message to a user.
        </p>
      </div>
      <ComposeForm users={users} />
    </div>
  );
}
