"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export type Notice = { type: "success" | "error"; text: string };
export type Notify = (notice: Notice) => void;

export function useNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  return { notice, notify: setNotice, dismiss: () => setNotice(null) };
}

export function NoticeMessage({
  notice,
  dismiss,
}: {
  notice: Notice | null;
  dismiss: () => void;
}) {
  if (!notice) return null;
  return (
    <Alert
      aria-live="polite"
      variant={notice.type === "error" ? "destructive" : "success"}
      className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100%-2rem)] items-center gap-4 shadow-lg"
    >
      <div className="flex items-start gap-4">
        <span className="flex-1">
          {notice.type === "error" ? "Error: " : "Success: "}
          {notice.text}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={dismiss}
          aria-label="Dismiss notification"
        >
          <X />
        </Button>
      </div>
    </Alert>
  );
}
