"use client";

import { toggleUserStatusAction } from "../actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTransition } from "react";

export default function UserStatusToggle({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleUserStatusAction(userId);
      if (result.success) toast.success(result.message);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <Button
      variant={isActive ? "destructive" : "default"}
      size="sm"
      disabled={pending}
      onClick={handleToggle}
    >
      {pending ? "…" : isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
