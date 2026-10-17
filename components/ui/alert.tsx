import type { ComponentProps } from "react";
import { CircleCheck, CircleAlert, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  default: { style: "border-info/15 bg-info-soft text-info", icon: Info },
  success: {
    style: "border-success/15 bg-success-soft text-success",
    icon: CircleCheck,
  },
  warning: {
    style: "border-warning/15 bg-warning-soft text-warning",
    icon: TriangleAlert,
  },
  destructive: {
    style: "border-destructive/20 bg-destructive-soft text-destructive",
    icon: CircleAlert,
  },
};
export function Alert({
  className,
  variant = "default",
  children,
  ...props
}: ComponentProps<"div"> & { variant?: keyof typeof variants }) {
  const { style, icon: Icon } = variants[variant];
  return (
    <div
      role="status"
      data-slot="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed",
        style,
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
