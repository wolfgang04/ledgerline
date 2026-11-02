import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
const variants = {
  default: "border-border bg-muted text-muted-foreground",
  primary: "border-primary/15 bg-accent text-accent-foreground",
  warning: "border-warning/15 bg-warning-soft text-warning",
  info: "border-info/15 bg-info-soft text-info",
};
export function Badge({
  className,
  variant = "default",
  ...props
}: ComponentProps<"span"> & { variant?: keyof typeof variants }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium leading-4",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
