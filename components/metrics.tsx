import type { LucideIcon } from "lucide-react";
import { Building2, Users, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
const tones = [
  "bg-accent text-primary",
  "bg-info-soft text-info",
  "bg-warning-soft text-warning",
];
const icons = [Users, Building2, ShieldCheck];
export function Metrics({
  items,
}: {
  items: { label: string; value: number | string; icon?: LucideIcon }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map(({ label, value, icon }, index) => {
        const Icon = icon ?? icons[index % icons.length];
        return (
          <Card key={label}>
            <CardContent className="flex items-center gap-4">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-xl ${tones[index % tones.length]}`}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                  {value}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
