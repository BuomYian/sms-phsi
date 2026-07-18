"use client";

import { useRef, useEffect, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, RemoveFormatting,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

type Cmd =
  | { exec: string; value?: string }
  | { block: string };

const TOOLBAR: (Cmd | "sep")[] = [
  { exec: "bold" },
  { exec: "italic" },
  { exec: "underline" },
  { exec: "strikeThrough" },
  "sep",
  { block: "h2" },
  { block: "h3" },
  "sep",
  { exec: "insertUnorderedList" },
  { exec: "insertOrderedList" },
  "sep",
  { exec: "justifyLeft" },
  { exec: "justifyCenter" },
  { exec: "justifyRight" },
  "sep",
  { exec: "removeFormat" },
];

const ICONS: Record<string, React.ReactNode> = {
  bold:                  <Bold className="h-3.5 w-3.5" />,
  italic:                <Italic className="h-3.5 w-3.5" />,
  underline:             <Underline className="h-3.5 w-3.5" />,
  strikeThrough:         <Strikethrough className="h-3.5 w-3.5" />,
  h2:                    <Heading2 className="h-3.5 w-3.5" />,
  h3:                    <Heading3 className="h-3.5 w-3.5" />,
  insertUnorderedList:   <List className="h-3.5 w-3.5" />,
  insertOrderedList:     <ListOrdered className="h-3.5 w-3.5" />,
  justifyLeft:           <AlignLeft className="h-3.5 w-3.5" />,
  justifyCenter:         <AlignCenter className="h-3.5 w-3.5" />,
  justifyRight:          <AlignRight className="h-3.5 w-3.5" />,
  removeFormat:          <RemoveFormatting className="h-3.5 w-3.5" />,
};

const LABELS: Record<string, string> = {
  bold: "Bold", italic: "Italic", underline: "Underline",
  strikeThrough: "Strikethrough", h2: "Heading 2", h3: "Heading 3",
  insertUnorderedList: "Bullet list", insertOrderedList: "Numbered list",
  justifyLeft: "Align left", justifyCenter: "Centre", justifyRight: "Align right",
  removeFormat: "Clear formatting",
};

export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "Write here…",
  disabled = false,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  // Set initial content once on mount
  useEffect(() => {
    if (editorRef.current && defaultValue) {
      editorRef.current.innerHTML = defaultValue;
      if (hiddenRef.current) hiddenRef.current.value = defaultValue;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = useCallback(() => {
    if (hiddenRef.current && editorRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
    }
  }, []);

  function run(cmd: Cmd) {
    if (disabled) return;
    editorRef.current?.focus();
    if ("exec" in cmd) {
      document.execCommand(cmd.exec, false, cmd.value);
    } else {
      // Block-level: wrap selection in tag
      document.execCommand("formatBlock", false, cmd.block);
    }
    sync();
  }

  return (
    <div className={cn("rounded-md border bg-background", disabled && "opacity-60 pointer-events-none")}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
        {TOOLBAR.map((item, i) => {
          if (item === "sep") {
            return <Separator key={i} orientation="vertical" className="mx-1 h-5" />;
          }
          const key = "exec" in item ? item.exec : item.block;
          return (
            <Button
              key={key}
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={LABELS[key]}
              aria-label={LABELS[key]}
              onMouseDown={(e) => {
                e.preventDefault(); // keep editor focus
                run(item);
              }}
            >
              {ICONS[key]}
            </Button>
          );
        })}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        data-placeholder={placeholder}
        className={cn(
          "min-h-[160px] px-3 py-2 text-sm outline-none",
          // Prose styling for rendered content
          "[&_b]:font-bold [&_strong]:font-bold",
          "[&_i]:italic [&_em]:italic",
          "[&_u]:underline",
          "[&_s]:line-through [&_strike]:line-through",
          "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1",
          "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1",
          "[&_li]:my-0.5",
          // Placeholder via CSS
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
        )}
      />

      {/* Hidden field submitted with the form */}
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValue} />
    </div>
  );
}
