"use client";

import { useActionState, useEffect } from "react";
import {
  sendMessageAction,
  type CommActionState,
} from "../../announcements/actions";
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
import { toast } from "sonner";

type UserOption = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

export default function ComposeForm({ users }: { users: UserOption[] }) {
  const initialState: CommActionState = {};
  const [state, formAction, isPending] = useActionState(
    sendMessageAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientId">To *</Label>
            <Select name="recipientId" required>
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
        </CardContent>
      </Card>
    </form>
  );
}
