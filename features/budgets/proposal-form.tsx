import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  useLeaveConfirmation,
  useUnsavedEditor,
} from "@/components/unsaved-changes";
import {
  allocationTotals,
  currencyLabel,
  formatFinancialAmount,
} from "@/lib/budget";
import type {
  Allocation,
  BudgetDepartment,
  BudgetPlan,
  ProposalInput,
} from "./types";

import { fiscalYearRange } from "./fiscal-year";

export function ProposalForm({
  plan,
  allocations: initialAllocations,
  departments = [],
  currency,
  month,
  pending,
  onSave,
  onCancel,
}: {
  plan?: BudgetPlan;
  allocations: Allocation[];
  departments?: BudgetDepartment[];
  currency: string;
  month: number;
  pending: boolean;
  onSave: (values: ProposalInput, reason: string) => void;
  onCancel: () => void;
}) {
  const today = new Date();
  const [allocations, setAllocations] = useState(initialAllocations);
  const [year, setYear] = useState(
    plan?.fiscal_year ??
      today.getFullYear() - (today.getMonth() + 1 < month ? 1 : 0),
  );
  const [total, setTotal] = useState(plan?.proposed_amount ?? "");
  const [amounts, setAmounts] = useState(
    allocations.map((allocation) => allocation.proposed_amount),
  );
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [reason, setReason] = useState("");
  const snapshot = JSON.stringify({
    name,
    description,
    reason,
    year,
    total,
    allocations,
    amounts,
  });
  const [initialSnapshot] = useState(snapshot);
  const dirty = snapshot !== initialSnapshot;
  const leave = useLeaveConfirmation();
  useUnsavedEditor(dirty, pending);
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
        className="max-w-5xl space-y-4 rounded-xl border bg-card p-4 sm:p-6"
      >
        <fieldset disabled={pending} className="space-y-6">
          <legend className="mb-4 text-base font-semibold">
            Proposal details
            {dirty && (
              <Badge variant="warning" className="ml-3">
                Unsaved changes
              </Badge>
            )}
          </legend>
          <div className="space-y-2">
            <Label htmlFor="proposal-name">Proposal title</Label>
            <Input
              id="proposal-name"
              name="name"
              required
              maxLength={255}
              value={name}
              onChange={(event) => setName(event.target.value)}
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
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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
                No departments included. The annual total will remain in
                reserve.
              </p>
            )}
            {departments
              .filter(
                (department) =>
                  department.eligible &&
                  !allocations.some(
                    (allocation) => allocation.department_id === department.id,
                  ),
              )
              .map((department) => (
                <Alert key={department.id} variant="warning">
                  <p>
                    <strong>{department.name}</strong> has a department manager
                    but has no budget allocation.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      setAllocations((previous) => [
                        ...previous,
                        {
                          department_id: department.id,
                          name: department.name,
                          proposed_amount: "0.00",
                        },
                      ]);
                      setAmounts((previous) => [...previous, "0.00"]);
                    }}
                  >
                    Add {department.name} to proposal
                  </Button>
                </Alert>
              ))}
            {departments.some((department) => !department.eligible) && (
              <p className="text-sm text-muted-foreground">
                Departments without managers are excluded:{" "}
                {departments
                  .filter((department) => !department.eligible)
                  .map((department) => department.name)
                  .join(", ")}
                .
              </p>
            )}
            {allocations.map((allocation, index) => (
              <div
                key={allocation.department_id}
                className="grid items-center gap-3 border-b py-3 sm:grid-cols-[minmax(0,1fr)_12rem_5rem]"
              >
                <div>
                  <Label htmlFor={`allocation-${allocation.department_id}`}>
                    {allocation.name}
                  </Label>
                  {departments.some(
                    (department) =>
                      department.id === allocation.department_id &&
                      !department.eligible,
                  ) && (
                    <p className="text-sm text-destructive">
                      No manager. Remove this department before submission.
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setAllocations((previous) =>
                        previous.filter((_, i) => i !== index),
                      );
                      setAmounts((previous) =>
                        previous.filter((_, i) => i !== index),
                      );
                    }}
                    aria-label={`Remove ${allocation.name} from proposal`}
                  >
                    Remove
                  </Button>
                </div>
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
              className="grid gap-3 border-y py-4 text-sm sm:grid-cols-2"
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
                Allocations exceed the annual total. You can save these working
                values, but must correct them before submission.
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
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full rounded-lg border border-input bg-card p-3"
              />
              <p className="text-xs text-muted-foreground">
                Every saved change records who changed each field, its previous
                and new values, and this reason.
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-3 border-t pt-4">
            <Button type="submit" variant="default">
              {pending ? "Saving..." : plan ? "Save changes" : "Save draft"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => leave.request(onCancel)}
            >
              Cancel editing
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Saving does not submit the proposal. Use Submit or Resubmit for
            review on the proposal screen after saving.
          </p>
        </fieldset>
      </form>
    </>
  );
}
