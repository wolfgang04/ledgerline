import { allocationTotals, formatFinancialAmount } from "@/lib/budget";
import type { ProposalSnapshot } from "./types";
import { fiscalYearRange } from "./fiscal-year";

export function ProposalOverview({ snapshot }: { snapshot: ProposalSnapshot }) {
  const totals =
    snapshot.proposed_amount !== null
      ? allocationTotals(
          snapshot.proposed_amount,
          snapshot.allocations.map((item) => item.proposed_amount),
        )
      : null;
  const amounts =
    snapshot.proposed_amount !== null
      ? [
          { label: "Annual total", value: snapshot.proposed_amount },
          { label: "Department allocations", value: totals?.allocated ?? null },
          { label: "Organization reserve", value: snapshot.reserve },
        ]
      : snapshot.allocations.map((item) => ({
          label: `${item.name} allocation`,
          value: item.proposed_amount,
        }));
  return (
    <div className="space-y-3 rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">
        {snapshot.fiscal_year_start_month
          ? fiscalYearRange(
              snapshot.fiscal_year,
              snapshot.fiscal_year_start_month,
            )
          : `FY ${snapshot.fiscal_year}`}
      </p>
      <dl className="grid gap-4 sm:grid-cols-3">
        {amounts.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs font-medium text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
              {value === null ? "—" : formatFinancialAmount(value)}{" "}
              <span className="text-xs font-medium text-muted-foreground">
                {snapshot.currency}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
