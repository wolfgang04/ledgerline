import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("w-full border-0 border-b border-[#aeb8af] bg-transparent px-0 py-2 text-[var(--ink)] outline-none focus:border-[var(--orange)]", className)} {...props} />;
}