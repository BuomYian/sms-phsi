"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  studentId: string;
  enrollmentId?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon";
}

export function DownloadTranscriptButton({
  studentId,
  enrollmentId,
  label = "Download PDF",
  variant = "outline",
  size = "default",
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const url = enrollmentId
        ? `/api/transcripts/${studentId}?enrollmentId=${enrollmentId}`
        : `/api/transcripts/${studentId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to generate transcript");

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download =
        res.headers
          .get("Content-Disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") ?? "transcript.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Downloaded");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleDownload} disabled={loading} variant={variant} size={size}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
