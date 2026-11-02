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
      <rect width="40" height="40" rx="12" fill="currentColor" />
      <path d="M12 11v18h17v-5H17V11h-5Z" fill="white" />
      <path d="M22 11h7v8h-7z" fill="white" opacity=".6" />
    </svg>
  );
}

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <LedgerlineMark
        className={inverse ? "text-sidebar-primary/25" : "text-primary"}
      />
      <span>
        <span className="block text-xl font-semibold tracking-tight">
          ledgerline
          <span className={inverse ? "text-sidebar-primary" : "text-primary"}>
            .
          </span>
        </span>
        <span
          className={cn(
            "block whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.12em]",
            inverse ? "text-sidebar-muted" : "text-muted-foreground",
          )}
        >
          Financial operations
        </span>
      </span>
    </span>
  );
}
