import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Alert({ className, variant = "default", ...props }: HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }) {
  return <div className={cn("border-l-3 px-4 py-3 text-xs", variant === "destructive" ? "border-[var(--orange)] bg-[#f8e4dc]" : "border-[#83a52b] bg-[#e8f0dc]", className)} {...props} />;
}