import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("bg-[var(--accent)] px-3 py-2 text-[10px] font-bold uppercase tracking-widest", className)} {...props} />;
}