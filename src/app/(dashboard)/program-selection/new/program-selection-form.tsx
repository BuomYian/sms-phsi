"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { programSelectionSchema, type ProgramSelectionInput } from "@/lib/validators";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitProgramSelection } from "../actions";
import { toast } from "sonner";
import { useTransition } from "react";
import Link from "next/link";

type Program = { id: string; name: string; code: string; description: string | null };

export default function ProgramSelectionForm({ programs }: { programs: Program[] }) {
  const [pending, startTransition] = useTransition();

  const form = useForm<ProgramSelectionInput>({
    resolver: zodResolver(programSelectionSchema),
    defaultValues: { requestedProgramId: "", notes: "" },
  });

  function onSubmit(values: ProgramSelectionInput) {
    startTransition(async () => {
      const data = new FormData();
      data.set("requestedProgramId", values.requestedProgramId);
      if (values.notes) data.set("notes", values.notes);
      const result = await submitProgramSelection(data);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="requestedProgramId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Programme</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a programme" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information for the administrator..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Submitting..." : "Submit Request"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/program-selection">Cancel</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
