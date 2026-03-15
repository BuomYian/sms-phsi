"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, Reply, User, Calendar } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { deleteMessageAction } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MessageDetailProps {
  message: {
    id: string;
    subject: string;
    body: string;
    isRead: boolean;
    createdAt: Date;
    sender: { id: string; fullName: string; email: string };
    recipient: { id: string; fullName: string; email: string };
  };
  isSender: boolean;
}

export function MessageDetail({ message, isSender }: MessageDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteMessageAction(message.id);
    if (result.success) {
      toast.success(result.message);
      router.push("/messages");
    } else {
      toast.error(result.error);
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/messages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{message.subject}</h1>
            <p className="text-sm text-muted-foreground">
              {isSender ? "To" : "From"}:{" "}
              {isSender ? message.recipient.fullName : message.sender.fullName}{" "}
              &middot; {formatRelativeTime(message.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isSender && (
            <Button variant="outline" asChild>
              <Link
                href={`/messages/compose?replyTo=${message.sender.id}&subject=Re: ${encodeURIComponent(message.subject)}`}
              >
                <Reply className="mr-2 h-4 w-4" />
                Reply
              </Link>
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this message. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Meta */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">From</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-medium">{message.sender.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {message.sender.email}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">To</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-medium">{message.recipient.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {message.recipient.email}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {formatRelativeTime(message.createdAt)}
            </p>
            {!isSender && (
              <Badge variant={message.isRead ? "secondary" : "default"}>
                {message.isRead ? "Read" : "Unread"}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Body */}
      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{message.body}</p>
        </CardContent>
      </Card>
    </>
  );
}
