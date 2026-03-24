import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Download, Search } from "lucide-react";

export const metadata = { title: "Audit Log" };

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  LOGIN:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; entity?: string }>;
}) {
  const { q, action: filterAction, entity } = await searchParams;

  const logs = await db.auditLog.findMany({
    where: {
      ...(q
        ? {
            user: {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
          }
        : {}),
      ...(filterAction ? { action: filterAction } : {}),
      ...(entity
        ? { entityType: { contains: entity, mode: "insensitive" } }
        : {}),
    },
    include: { user: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const actionCounts = logs.reduce(
    (acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const hasFilters = q || filterAction || entity;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            System activity trail — last 200 entries.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/api/reports/export?type=audit" download>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </a>
        </Button>
      </div>

      <form className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search by user..."
            defaultValue={q || ""}
            className="pl-8"
          />
        </div>
        <Input
          name="action"
          placeholder="Action (CREATE, UPDATE...)"
          defaultValue={filterAction || ""}
          className="w-44"
        />
        <Input
          name="entity"
          placeholder="Entity type..."
          defaultValue={entity || ""}
          className="w-44"
        />
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings/audit-log">Clear</Link>
          </Button>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        {Object.entries(actionCounts).map(([action, count]) => (
          <Link key={action} href={`/settings/audit-log?action=${action}`}>
            <Badge className={ACTION_COLORS[action] ?? ""} variant="outline">
              {action}: {count}
            </Badge>
          </Link>
        ))}
        <Badge variant="secondary">Total: {logs.length}</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.user.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={ACTION_COLORS[log.action] ?? ""}
                      variant="outline"
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.entityType}
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[120px] truncate">
                    {log.entityId ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs">
                    {log.details
                      ? JSON.stringify(log.details).slice(0, 80)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No audit entries.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
