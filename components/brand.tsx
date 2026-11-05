import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function LedgerlineMark({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={cn("size-10 shrink-0", className)}
      {...props}
    >
      <path
        d="M7 7h6v26H7zM17 7h16v6H17zM17 17h12v6H17zM17 27h16v6H17z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Brand({
  inverse = false,
  compact = false,
}: {
  inverse?: boolean;
  compact?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LedgerlineMark
        className={cn(
          "size-8",
          inverse ? "text-sidebar-primary" : "text-primary",
        )}
      />
      {!compact && (
        <span className="text-xl font-semibold tracking-tight">Ledgerline</span>
      )}
    </span>
  );
}
