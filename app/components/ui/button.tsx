import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-between gap-3 text-xs font-bold tracking-wide transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-50 disabled:hover:translate-y-0",
        variant === "default"
          ? "bg-[var(--ink)] px-4 py-3 text-white hover:bg-[var(--orange)]"
          : "bg-transparent text-[var(--muted)] underline decoration-1 underline-offset-4",
        className,
      )}
      {...props}
    />
  );
}
