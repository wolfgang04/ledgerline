import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full border-0 border-b border-[#aeb8af] bg-transparent px-0 py-2 text-[var(--ink)] outline-none placeholder:text-[#a4ada5] focus:border-[var(--orange)]",
        className,
      )}
      {...props}
    />
  );
}
