import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import SponsorClassForm from "./sponsor-class-form";

export const metadata = { title: "Sponsor a Class" };

export default async function SponsorClassPage() {
  const session = await getSession();
  if (!session) return null;

  const isAdmin =
    session.role === "SUPER_ADMIN" ||
    session.role === "ADMIN" ||
    session.role === "FINANCE";
  if (!isAdmin) redirect("/fees/scholarships");

  const [classes, sponsors] = await Promise.all([
    db.academicClass.findMany({
      include: {
        program: { select: { name: true, code: true } },
        academicYear: { select: { name: true, startDate: true } },
        // Filtered count — a bare _count would include WITHDRAWN and FAILED
        // members and promise more students than the action will sponsor.
        _count: { select: { students: { where: { status: "ACTIVE" } } } },
      },
      orderBy: [
        { academicYear: { startDate: "desc" } },
        { yearLevel: "asc" },
        { name: "asc" },
      ],
    }),
    db.scholarship.findMany({
      distinct: ["sponsor"],
      select: { sponsor: true },
      orderBy: { sponsor: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sponsor a Class</h1>
        <p className="text-muted-foreground">
          Award a scholarship to every active student in a class, and apply it
          to fees they have already been billed.
        </p>
      </div>
      <SponsorClassForm
        classes={classes.map((c) => ({
          id: c.id,
          name: c.name,
          programCode: c.program.code,
          academicYear: c.academicYear.name,
          yearStartDate: c.academicYear.startDate.toISOString().split("T")[0],
          activeStudents: c._count.students,
        }))}
        existingSponsors={sponsors.map((s) => s.sponsor)}
      />
    </div>
  );
}
