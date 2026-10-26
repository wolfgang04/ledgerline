import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  allocationTotals,
  currencyLabel,
  formatFinancialAmount,
} from "@/lib/budget";
import type { Allocation, BudgetPlan, ProposalInput } from "./queries";

export function fiscalYearRange(year: number, month: number) {
  const date = (value: Date) =>
    value.toLocaleDateString("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return `${date(new Date(Date.UTC(year, month - 1, 1)))} – ${date(new Date(Date.UTC(year + 1, month - 1, 0)))}`;
}

export function ProposalForm({
  plan,
  allocations,
  currency,
  month,
  pending,
  blocked,
  onSave,
  onSubmit,
  onCancel,
}: {
  plan?: BudgetPlan;
  allocations: Allocation[];
  currency: string;
  month: number;
  pending: boolean;
  blocked?: boolean;
  onSave: (values: ProposalInput, reason: string) => void;
  onSubmit: (summary: string) => void;
  onCancel: () => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(
    plan?.fiscal_year ??
      today.getFullYear() - (today.getMonth() + 1 < month ? 1 : 0),
  );
  const [total, setTotal] = useState(plan?.proposed_amount ?? "");
  const [amounts, setAmounts] = useState(
    allocations.map((allocation) => allocation.proposed_amount),
  );
  const [dirty, setDirty] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const autoSubmit = plan?.status === "revising";
  const digits = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits!;
  const totals = allocationTotals(total, amounts);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave(
      {
        name: String(data.get("name")),
        description: String(data.get("description")),
        fiscal_year: year,
        proposed_amount: total,
        allocations: allocations.map((allocation, index) => ({
          department_id: allocation.department_id,
          proposed_amount: amounts[index],
        })),
      },
      String(data.get("reason") ?? ""),
    );
  }
  return (
    <>
      <form
        onSubmit={save}
        onChange={() => setDirty(true)}
        className="space-y-4"
      >
        <fieldset disabled={pending} className="space-y-6">
          <legend className="mb-4 text-base font-semibold">
            Proposal details
          </legend>
          <div className="space-y-2">
            <Label htmlFor="proposal-name">Proposal title</Label>
            <Input
              id="proposal-name"
              name="name"
              required
              maxLength={255}
              defaultValue={plan?.name ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proposal-year">
                Financial year (starting year)
              </Label>
              <Input
                id="proposal-year"
                name="year"
                type="number"
                required
                min={1900}
                max={9998}
                step={1}
                readOnly={!!plan?.revision_number}
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal-amount">
                Annual total ({currencyLabel(currency)})
              </Label>
              <Input
                id="proposal-amount"
                name="amount"
                inputMode="decimal"
                required
                pattern={
                  digits === 0 ? "[0-9]+([.]0{1,2})?" : "[0-9]+([.][0-9]{1,2})?"
                }
                value={total}
                onChange={(event) => setTotal(event.target.value)}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {Number.isInteger(year) && year >= 1900 && year <= 9998
              ? fiscalYearRange(year, month)
              : "Enter a valid starting year."}
          </p>
          <div className="space-y-2">
            <Label htmlFor="proposal-rationale">Rationale</Label>
            <textarea
              id="proposal-rationale"
              name="description"
              required
              maxLength={1000}
              rows={4}
              defaultValue={plan?.description ?? ""}
              className="w-full rounded-lg border border-input bg-card p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold">Department allocations</h3>
            <p className="text-sm text-muted-foreground">
              Allocate the annual total across departments. Any remaining amount
              stays in reserve.
            </p>
            {!allocations.length && (
              <p className="text-sm text-muted-foreground">
                No departments yet. The annual total will remain in reserve.
              </p>
            )}
            {allocations.map((allocation, index) => (
              <div
                key={allocation.department_id}
                className="grid items-center gap-3 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_12rem_5rem]"
              >
                <Label htmlFor={`allocation-${allocation.department_id}`}>
                  {allocation.name}
                </Label>
                <Input
                  id={`allocation-${allocation.department_id}`}
                  aria-label={`${allocation.name} allocation in ${currency}`}
                  inputMode="decimal"
                  required
                  pattern={
                    digits === 0
                      ? "[0-9]+([.]0{1,2})?"
                      : "[0-9]+([.][0-9]{1,2})?"
                  }
                  value={amounts[index]}
                  onChange={(event) =>
                    setAmounts((previous) =>
                      previous.map((amount, i) =>
                        i === index ? event.target.value : amount,
                      ),
                    )
                  }
                />
                <span className="text-sm tabular-nums text-muted-foreground sm:text-right">
                  {totals?.percentages[index] ?? "—"}
                </span>
              </div>
            ))}
            <dl
              aria-live="polite"
              className="grid gap-3 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-2"
            >
              <div>
                <dt className="text-muted-foreground">Total allocated</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">
                  {totals ? formatFinancialAmount(totals.allocated) : "—"}{" "}
                  {currency}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Unallocated reserve</dt>
                <dd
                  className={`mt-1 text-lg font-semibold tabular-nums ${totals?.overallocated ? "text-destructive" : ""}`}
                >
                  {totals ? formatFinancialAmount(totals.reserve) : "—"}{" "}
                  {currency}
                </dd>
              </div>
            </dl>
            {totals?.overallocated && (
              <Alert variant="destructive">
                Allocations exceed the annual total.{" "}
                {autoSubmit
                  ? "Correct them before saving and submitting."
                  : "You can save this draft, but must correct it before submission."}
              </Alert>
            )}
          </div>
          {plan && (
            <div className="space-y-2">
              <Label htmlFor="change-reason">Reason for these changes</Label>
              <textarea
                id="change-reason"
                name="reason"
                required
                maxLength={1000}
                rows={2}
                className="w-full rounded-lg border border-input bg-card p-3"
              />
              <p className="text-xs text-muted-foreground">
                Every saved change records who changed each field, its previous
                and new values, and this reason.
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-3 border-t pt-4">
            <Button
              type="submit"
              variant={plan && !autoSubmit ? "outline" : "default"}
              disabled={
                autoSubmit && (!totals || totals.overallocated || blocked)
              }
            >
              {pending
                ? "Saving…"
                : autoSubmit
                  ? "Save and submit revision"
                  : plan
                    ? "Save changes"
                    : "Save draft"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Close
            </Button>
            {plan && !autoSubmit && (
              <Button
                type="button"
                disabled={dirty || blocked || !totals || totals.overallocated}
                onClick={() => setConfirm(true)}
              >
                {plan.revision_number
                  ? "Resubmit for review"
                  : "Submit for review"}
              </Button>
            )}
          </div>
          {autoSubmit && (
            <p className="text-sm text-muted-foreground">
              Saving changed values immediately creates a submitted version and
              returns this proposal to review. Your change reason becomes the
              revision summary.
            </p>
          )}
          {dirty && plan && !autoSubmit && (
            <p className="text-sm text-muted-foreground">
              Save your changes before submitting. Changes to agreed values
              require confirmation again.
            </p>
          )}
          {blocked && (
            <p className="text-sm text-muted-foreground">
              Resubmission is unavailable while changes need requester agreement
              or a newer proposal version needs reloading.
            </p>
          )}
        </fieldset>
      </form>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogTitle>
            {plan?.revision_number
              ? "Resubmit revised proposal?"
              : "Submit annual proposal?"}
          </DialogTitle>
          <DialogDescription>
            This creates an immutable submitted version for managers to review.
            Finance can start a revision later without waiting for a review.
          </DialogDescription>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const summary = String(
                new FormData(event.currentTarget).get("summary"),
              );
              setConfirm(false);
              onSubmit(summary);
            }}
          >
            <Label htmlFor="revision-summary">
              {plan?.revision_number
                ? "Revision summary"
                : "Submission summary"}
            </Label>
            <textarea
              id="revision-summary"
              name="summary"
              required
              maxLength={1000}
              rows={3}
              className="w-full rounded-lg border p-3"
            />
            <Button type="submit" disabled={pending}>
              Confirm submission
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
