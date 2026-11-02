import { useState, type FormEvent, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useLeaveConfirmation,
  useUnsavedEditor,
} from "@/components/unsaved-changes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiError } from "@/lib/api";
import { allocationTotals, formatFinancialAmount } from "@/lib/budget";
import type { DepartmentSpendingPlan, SpendingPlanInput } from "./types";

export function DepartmentSpendingPlanPanel({
  plan,
  revision,
  currency,
  editable,
  pending,
  onEditingChange,
  onSave,
  approval,
}: {
  plan: DepartmentSpendingPlan;
  revision: number;
  currency: string;
  editable: boolean;
  pending: boolean;
  onEditingChange: (editing: boolean) => void;
  onSave: (values: SpendingPlanInput) => Promise<void>;
  approval: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [lines, setLines] = useState(plan.lines);
  const [version, setVersion] = useState(plan.version);
  const [editRevision, setEditRevision] = useState(revision);
  const [error, setError] = useState<string | null>(null);
  const [savedLines, setSavedLines] = useState(JSON.stringify(plan.lines));
  const dirty = editing && JSON.stringify(lines) !== savedLines;
  const leave = useLeaveConfirmation();
  useUnsavedEditor(dirty, editing && pending);
  const totals = allocationTotals(
    plan.allocated_amount,
    lines.map((line) => line.amount),
  );
  const stale = version !== plan.version || editRevision !== revision;
  function load() {
    setLines(plan.lines.map((line) => ({ ...line })));
    setSavedLines(JSON.stringify(plan.lines));
    setVersion(plan.version);
    setEditRevision(revision);
    setError(null);
    setEditing(true);
    onEditingChange(true);
  }
  function close() {
    setEditing(false);
    onEditingChange(false);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setError(null);
      await onSave({ revision_number: editRevision, version, lines });
      close();
    } catch (value) {
      setError(getApiError(value));
    }
  }
  return (
    <section
      aria-label={`${plan.name} annual spending plan`}
      className="space-y-4 rounded-xl border bg-card p-4 sm:p-6"
    >
      <div className="grid gap-3 border-b pb-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <h4 className="font-semibold">{plan.name} spending plan</h4>
        <div className="sm:text-right">
          <p className="text-lg font-semibold tracking-tight tabular-nums">
            {formatFinancialAmount(plan.allocated_amount)}{" "}
            <span className="text-xs font-medium text-muted-foreground">
              {currency}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Department allocation
          </p>
        </div>
      </div>
      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <fieldset disabled={pending} className="space-y-3">
            <legend className="text-sm font-medium">
              Annual spending categories
              {dirty && (
                <Badge variant="warning" className="ml-3">
                  Unsaved changes
                </Badge>
              )}
            </legend>
            {lines.map((line, index) => (
              <div
                key={index}
                className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
              >
                <div className="space-y-1">
                  <Label
                    htmlFor={`spending-category-${plan.department_id}-${index}`}
                  >
                    Category {index + 1}
                  </Label>
                  <Input
                    id={`spending-category-${plan.department_id}-${index}`}
                    required
                    maxLength={100}
                    value={line.category}
                    onChange={(event) =>
                      setLines(
                        lines.map((item, i) =>
                          i === index
                            ? { ...item, category: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor={`spending-amount-${plan.department_id}-${index}`}
                  >
                    Annual amount ({currency})
                  </Label>
                  <Input
                    id={`spending-amount-${plan.department_id}-${index}`}
                    required
                    inputMode="decimal"
                    pattern="[0-9]+([.][0-9]{1,2})?"
                    value={line.amount}
                    onChange={(event) =>
                      setLines(
                        lines.map((item, i) =>
                          i === index
                            ? { ...item, amount: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="self-end"
                  aria-label={`Remove spending category ${index + 1}`}
                  onClick={() => setLines(lines.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={lines.length >= 100}
              onClick={() => setLines([...lines, { category: "", amount: "" }])}
            >
              Add spending category
            </Button>
            <p aria-live="polite" className="text-sm">
              Total planned:{" "}
              {totals ? formatFinancialAmount(totals.allocated) : "-"}{" "}
              {currency}. Unplanned funds:{" "}
              {totals ? formatFinancialAmount(totals.reserve) : "-"} {currency}.
            </p>
            {totals?.overallocated && (
              <Alert variant="destructive">
                Planned spending exceeds the department allocation. Reduce the
                amounts before saving.
              </Alert>
            )}
            {stale && (
              <Alert variant="warning">
                The saved plan or submitted proposal changed. Reloading the
                saved plan will discard these local edits.
              </Alert>
            )}
            {error && <Alert variant="destructive">{error}</Alert>}
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={!editable || stale || !totals || totals.overallocated}
              >
                {pending ? "Saving..." : "Save spending plan"}
              </Button>
              {stale && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => leave.request(load)}
                >
                  Reload saved spending plan
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => leave.request(close)}
              >
                Cancel spending edits
              </Button>
            </div>
            {!editable && (
              <p className="text-sm">
                The proposal must be under review before spending changes can be
                saved.
              </p>
            )}
          </fieldset>
        </form>
      ) : (
        <>
          {plan.lines.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spending category</TableHead>
                  <TableHead className="text-right">
                    Annual amount ({currency})
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.lines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell className="whitespace-normal break-words">
                      {line.category}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatFinancialAmount(line.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No categories entered. The allocation is currently unplanned.
            </p>
          )}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt>Total planned</dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {formatFinancialAmount(plan.planned_amount)} {currency}
              </dd>
            </div>
            <div>
              <dt>Unplanned funds</dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {formatFinancialAmount(plan.unplanned_amount)} {currency}
              </dd>
            </div>
          </dl>
          {plan.unplanned_amount.startsWith("-") && (
            <Alert variant="warning">
              This breakdown exceeds the current allocation. A department
              manager must correct it before approval.
            </Alert>
          )}
          {editable && (
            <Button type="button" variant="outline" onClick={load}>
              Edit spending plan
            </Button>
          )}
        </>
      )}
      <p className="text-xs text-muted-foreground">
        Unplanned funds remain within the department allocation. Approval
        confirms the saved categories and remainder. Changing them requires
        fresh department and overall approval.
      </p>
      <div className="space-y-3 border-t pt-4">{approval}</div>
    </section>
  );
}
