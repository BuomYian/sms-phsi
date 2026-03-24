"use client";

import { useActionState, useEffect, useState } from "react";
import {
  sendMessageAction,
  broadcastMessageAction,
  type MessageActionState,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type UserOption = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

export default function ComposeForm({
  users,
  defaultRecipientId,
  defaultSubject,
  isAdmin,
}: {
  users: UserOption[];
  defaultRecipientId?: string;
  defaultSubject?: string;
  isAdmin?: boolean;
}) {
  const [mode, setMode] = useState<"individual" | "broadcast">("individual");
  const initialState: MessageActionState = {};
  const [state, formAction, isPending] = useActionState(
    sendMessageAction,
    initialState,
  );
  const [broadcastState, broadcastAction, broadcastPending] = useActionState(
    broadcastMessageAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  useEffect(() => {
    if (broadcastState?.success) toast.success(broadcastState.message);
    if (broadcastState?.error) toast.error(broadcastState.error);
  }, [broadcastState]);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Message</CardTitle>
        {isAdmin && (
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "individual" | "broadcast")}
          >
            <TabsList>
              <TabsTrigger value="individual">Individual</TabsTrigger>
              <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      <CardContent>
        {mode === "broadcast" ? (
          <form action={broadcastAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetRole">Send To *</Label>
              <Select name="targetRole" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Users</SelectItem>
                  <SelectItem value="STUDENT">All Students</SelectItem>
                  <SelectItem value="INSTRUCTOR">All Instructors</SelectItem>
                  <SelectItem value="PARENT">All Parents</SelectItem>
                  <SelectItem value="FINANCE">Finance Staff</SelectItem>
                  <SelectItem value="ADMIN">Administrators</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input name="subject" required placeholder="Message subject" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message *</Label>
              <Textarea
                name="body"
                required
                rows={6}
                placeholder="Write your broadcast message..."
              />
            </div>

            <Button type="submit" disabled={broadcastPending}>
              {broadcastPending ? "Sending…" : "Send Broadcast"}
            </Button>
          </form>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipientId">To *</Label>
              <Select
                name="recipientId"
                required
                defaultValue={defaultRecipientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                name="subject"
                required
                defaultValue={defaultSubject}
                placeholder="Message subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message *</Label>
              <Textarea
                id="body"
                name="body"
                required
                rows={6}
                placeholder="Write your message..."
              />
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending…" : "Send Message"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
