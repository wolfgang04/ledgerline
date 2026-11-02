import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { reviewStep, reviewSteps, reviewStatus } from "./workflow";

export function ReviewProgress({ stage }: { stage: string }) {
  const current = reviewStep(stage);
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium" role="status">
        {reviewStatus(stage)}
      </p>
      <ol
        aria-label="Budget approval progress"
        className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4"
      >
        {reviewSteps.map((step, index) => (
          <li
            key={step}
            aria-current={current === index ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 border-b pb-3 text-xs text-muted-foreground",
              index < current && "border-success text-success",
              index === current && "border-primary text-primary font-semibold",
            )}
          >
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border text-[10px] tabular-nums",
                index < current && "border-success bg-success text-white",
                index === current && "border-primary bg-primary text-white",
              )}
            >
              {index < current ? (
                <Check className="size-3" aria-label="Completed" />
              ) : (
                index + 1
              )}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
