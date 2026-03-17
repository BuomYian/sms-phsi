"use client";

import { useActionState } from "react";
import { updateParentAction, type ParentActionState } from "../../actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ParentEditFormProps {
  parent: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  };
}

export function ParentEditForm({ parent }: ParentEditFormProps) {
  const boundAction = updateParentAction.bind(null, parent.id);
  const [state, formAction, isPending] = useActionState<
    ParentActionState,
    FormData
  >(boundAction, {});

  const [isActive, setIsActive] = useState(parent.isActive);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" name="isActive" value={String(isActive)} />

      <Card>
        <CardHeader>
          <CardTitle>Parent Information</CardTitle>
          <CardDescription>
            Update parent details. Email cannot be changed.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={parent.fullName}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={parent.email}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={parent.phone ?? ""}
              disabled={isPending}
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isPending}
            />
            <Label htmlFor="isActive">Account Active</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/parents/${parent.id}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
