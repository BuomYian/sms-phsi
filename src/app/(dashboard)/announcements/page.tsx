import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const session = await getSession();
  const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "ADMIN";
  const canCreate = isAdmin || session?.role === "INSTRUCTOR";

  // Build role-based audience filter
  const audienceFilter = isAdmin
    ? {} // Admins see all announcements
    : {
        targetAudience: {
          in: [
            "ALL",
            ...(session?.role === "STUDENT" ? ["STUDENTS"] : []),
            ...(session?.role === "INSTRUCTOR" ? ["INSTRUCTORS", "STAFF"] : []),
            ...(session?.role === "PARENT" ? ["PARENTS"] : []),
            ...(session?.role === "FINANCE" ? ["STAFF"] : []),
          ],
        },
      };

  const announcements = await db.announcement.findMany({
    where: audienceFilter,
    include: {
      author: { select: { fullName: true } },
      program: { select: { name: true } },
    },
    orderBy: { publishDate: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Institution-wide and program-specific announcements.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/announcements/new">
              <Plus className="mr-2 h-4 w-4" /> New Announcement
            </Link>
          </Button>
        )}
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No announcements yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{a.title}</CardTitle>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>By {a.author.fullName}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(a.publishDate)}</span>
                      {a.program && (
                        <>
                          <span>·</span>
                          <Badge variant="outline">{a.program.name}</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">{a.targetAudience}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">
                  {a.body
                    .replace(/<[^>]*>/g, " ")
                    .replace(/&nbsp;/g, " ")
                    .replace(/&amp;/g, "&")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/\s+/g, " ")
                    .trim()}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  {a.expiryDate ? (
                    <p className="text-xs text-muted-foreground">
                      Expires: {formatDate(a.expiryDate)}
                    </p>
                  ) : (
                    <span />
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/announcements/${a.id}`}>
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
