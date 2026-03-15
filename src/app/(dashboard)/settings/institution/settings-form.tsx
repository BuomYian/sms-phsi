"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSettingsAction, type SettingsActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus } from "lucide-react";

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
  const [newFields, setNewFields] = useState<{ key: string; value: string }[]>(
    [],
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      setNewFields([]);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  function addField() {
    setNewFields((prev) => [...prev, { key: "", value: "" }]);
  }

  return (
    <form action={formAction}>
      <Card className="max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="capitalize">{category} Settings</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            <Plus className="mr-1 h-3 w-3" /> Add Setting
          </Button>
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

          {newFields.map((f, i) => (
            <div key={`new-${i}`} className="space-y-2 rounded border p-3">
              <Label className="text-xs text-muted-foreground">
                New Setting
              </Label>
              <Input
                placeholder="Setting key (e.g. late_fee_percentage)"
                value={f.key}
                onChange={(e) => {
                  const updated = [...newFields];
                  updated[i].key = e.target.value;
                  setNewFields(updated);
                }}
              />
              <Input
                name={f.key ? `setting_${f.key}` : undefined}
                placeholder="Value"
                value={f.value}
                onChange={(e) => {
                  const updated = [...newFields];
                  updated[i].value = e.target.value;
                  setNewFields(updated);
                }}
              />
              {f.key && (
                <input
                  type="hidden"
                  name={`category_${f.key}`}
                  value={category}
                />
              )}
            </div>
          ))}

          {settings.length === 0 && newFields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No settings found. Click &quot;Add Setting&quot; to create one.
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
