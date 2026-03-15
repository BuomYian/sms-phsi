import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Mail, MailOpen } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [inbox, sent] = await Promise.all([
    db.message.findMany({
      where: { recipientId: session.id },
      include: { sender: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.message.findMany({
      where: { senderId: session.id },
      include: { recipient: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const unreadCount = inbox.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
              : "Your messages"}
          </p>
        </div>
        <Button asChild>
          <Link href="/messages/compose">
            <Plus className="mr-2 h-4 w-4" /> Compose
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">
            Inbox{" "}
            {unreadCount > 0 && <Badge className="ml-2">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-2 mt-4">
          {inbox.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No messages in your inbox.
              </CardContent>
            </Card>
          ) : (
            inbox.map((m) => (
              <Card
                key={m.id}
                className={m.isRead ? "" : "border-primary/30 bg-primary/5"}
              >
                <CardContent className="flex items-start gap-3 py-4">
                  {m.isRead ? (
                    <MailOpen className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Mail className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/messages/${m.id}`}
                        className="font-medium truncate hover:underline"
                      >
                        {m.subject}
                      </Link>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(m.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      From: {m.sender.fullName}
                    </p>
                    <p className="mt-1 text-sm truncate">{m.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-2 mt-4">
          {sent.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No sent messages.
              </CardContent>
            </Card>
          ) : (
            sent.map((m) => (
              <Card key={m.id}>
                <CardContent className="flex items-start gap-3 py-4">
                  <MailOpen className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/messages/${m.id}`}
                        className="font-medium truncate hover:underline"
                      >
                        {m.subject}
                      </Link>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(m.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      To: {m.recipient.fullName}
                    </p>
                    <p className="mt-1 text-sm truncate">{m.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
