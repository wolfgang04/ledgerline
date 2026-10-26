import {
  currencyLabel,
  allocationTotals,
  formatFinancialAmount,
} from "@/lib/budget";
import type { ProposalSnapshot } from "./queries";
import { fiscalYearRange } from "./proposal-form";

export function AllocationSummary({
  snapshot,
}: {
  snapshot: ProposalSnapshot;
}) {
  const totals = snapshot.proposed_amount
    ? allocationTotals(
        snapshot.proposed_amount,
        snapshot.allocations.map((allocation) => allocation.proposed_amount),
      )
    : null;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {snapshot.fiscal_year_start_month
          ? fiscalYearRange(
              snapshot.fiscal_year,
              snapshot.fiscal_year_start_month,
            )
          : `FY ${snapshot.fiscal_year}`}
      </p>
      {snapshot.proposed_amount !== null && (
        <p className="rounded-xl bg-muted/50 p-4 text-xl font-semibold tabular-nums">
          Annual total: {formatFinancialAmount(snapshot.proposed_amount)}{" "}
          {snapshot.currency ? currencyLabel(snapshot.currency) : ""}
        </p>
      )}
      {snapshot.description && (
        <p className="whitespace-pre-wrap break-words">
          {snapshot.description}
        </p>
      )}
      {snapshot.baseline && (
        <p className="text-sm text-muted-foreground">
          Historical baseline. Department allocations were not recorded for this
          version.
        </p>
      )}
      <div className="space-y-2">
        {snapshot.allocations.map((allocation, index) => (
          <div
            className="flex flex-wrap justify-between gap-2 rounded-lg border p-3"
            key={allocation.department_id}
          >
            <span className="min-w-0 break-words font-medium">
              {allocation.name}
            </span>
            <span className="tabular-nums">
              {formatFinancialAmount(allocation.proposed_amount)}{" "}
              {snapshot.currency}{" "}
              {totals ? `(${totals.percentages[index]})` : ""}
            </span>
          </div>
        ))}
      </div>
      {snapshot.reserve !== null && (
        <p className="rounded-xl border p-3 font-medium tabular-nums">
          Unallocated reserve: {formatFinancialAmount(snapshot.reserve)}{" "}
          {snapshot.currency}
        </p>
      )}
    </div>
  );
}
