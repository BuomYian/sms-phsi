"use client";

import { useActionState, useEffect } from "react";
import { updateSettingsAction, type SettingsActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Setting = { id: string; key: string; value: string; category: string };

export default function SettingsForm({
  settings,
  category,
}: {
  settings: Setting[];
  category: string;
}) {
  const initialState: SettingsActionState = {};
  const [state, formAction, isPending] = useActionState(
    updateSettingsAction,
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
          <CardTitle className="capitalize">{category} Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.map((s) => (
            <div key={s.key} className="space-y-2">
              <Label htmlFor={s.key} className="capitalize">
                {s.key.replace(/_/g, " ")}
              </Label>
              <Input
                id={s.key}
                name={`setting_${s.key}`}
                defaultValue={s.value}
              />
              <input
                type="hidden"
                name={`category_${s.key}`}
                value={category}
              />
            </div>
          ))}

          {settings.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No settings found for this category.
            </p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
