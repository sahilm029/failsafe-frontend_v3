"use client";

import { memo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface JSONEditorProps {
  value: Record<string, unknown> | null;
  onChange?: (value: Record<string, unknown>) => void;
  readOnly?: boolean;
  className?: string;
}

export const JSONEditor = memo(function JSONEditor({
  value,
  onChange,
  readOnly = false,
  className,
}: JSONEditorProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value !== null) {
      setText(JSON.stringify(value, null, 2));
    } else {
      setText("");
    }
  }, [value]);

  const handleChange = (newText: string) => {
    setText(newText);

    if (!onChange) return;

    try {
      const parsed = JSON.parse(newText);
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // Syntax highlighting for read-only view
  const highlightJSON = (json: string) => {
    return json
      .replace(/"([^"]+)":/g, '<span class="text-info">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-success">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="text-warning">$1</span>')
      .replace(/: (true|false)/g, ': <span class="text-secondary">$1</span>')
      .replace(/: null/g, ': <span class="text-text-muted">null</span>');
  };

  if (readOnly) {
    return (
      <div
        className={cn(
          "bg-surface border border-border rounded p-4 overflow-auto font-mono text-sm",
          className
        )}
      >
        <pre
          className="text-text-primary"
          dangerouslySetInnerHTML={{ __html: highlightJSON(text) }}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          "w-full h-full bg-surface border border-border rounded p-4 font-mono text-sm text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary",
          error && "border-danger"
        )}
        spellCheck={false}
      />
      {error && (
        <div className="absolute bottom-2 left-2 right-2 bg-danger/10 border border-danger rounded px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}
    </div>
  );
});
