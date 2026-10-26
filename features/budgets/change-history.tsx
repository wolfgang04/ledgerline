import type { ProposalDetail, ProposalAuditEvent } from "./queries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  formatBudgetTimestamp,
  proposalHistorySummary,
  formatFinancialAmount,
} from "@/lib/budget";

const fieldLabels: Record<string, string> = {
  name: "Title",
  description: "Rationale",
  fiscal_year: "Financial year",
  proposed_amount: "Annual total",
  currency: "Currency",
  fiscal_year_start_month: "Fiscal-year start month",
  reserve: "Unallocated reserve",
  status: "Status",
  revision_number: "Submitted version",
  submitted_at: "Submission time",
  allocation: "Allocation",
  department_name: "Department name",
};

export function ChangeHistory({
  detail,
  edit,
}: {
  detail: ProposalDetail;
  edit?: ProposalAuditEvent;
}) {
  const { count, latest, events } = proposalHistorySummary(
    edit ? [edit] : detail.audit,
    edit ? [] : detail.messages,
  );
  const actions: Record<string, string> = {
    edited: "edited the proposal",
    revision_started: "started a revision",
    resubmitted: "resubmitted the proposal",
    revision_requested: "requested a revision",
    revision_agreed: "agreed to the requested revision",
  };
  const fields =
    latest?.action === "edited"
      ? [
          ...new Set(
            latest.changes
              .filter(
                (change) =>
                  ![
                    "reserve",
                    "submitted_at",
                    "status",
                    "revision_number",
                  ].includes(change.field),
              )
              .map(
                (change) =>
                  `${change.department_name ? `${change.department_name} · ` : ""}${fieldLabels[change.field] ?? change.field}`,
              ),
          ),
        ]
      : [];
  return (
    <div
      className={
        edit
          ? "text-center"
          : "flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
      }
      aria-label={edit ? "Proposal edit" : "Latest proposal change"}
    >
      <Dialog>
        <DialogTrigger
          render={
            <Button
              type="button"
              variant={edit ? "ghost" : "outline"}
              className={
                edit
                  ? "h-auto max-w-full whitespace-normal text-sm underline underline-offset-4"
                  : undefined
              }
            />
          }
        >
          {edit
            ? `${edit.author_name} edited the proposal · ${formatBudgetTimestamp(edit.created_at)} · View edits`
            : `View change history · ${count} ${count === 1 ? "change" : "changes"}`}
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogTitle>
            {edit ? "Proposal edit details" : "Change history"}
          </DialogTitle>
          <DialogDescription>
            {edit
              ? "Saved changes made by finance, including previous and new values."
              : "Newest changes first. Proposal edits, revision requests, agreements, and revisions are recorded here. Conversation comments are shown in Conversations."}
          </DialogDescription>
          <section className="space-y-3" aria-label="Change history">
            {!events.length && (
              <p className="text-sm text-muted-foreground">
                No changes recorded in your scope.
              </p>
            )}
            <ol className="space-y-3">
              {events.map((event) => (
                <li key={event.key} className="space-y-2 rounded-lg border p-4">
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="font-medium">{event.author_name}</span>
                    <span>{actions[event.action]}</span>
                    <time
                      className="text-muted-foreground"
                      dateTime={event.created_at}
                    >
                      {formatBudgetTimestamp(event.created_at)}
                    </time>
                    <span className="text-muted-foreground">
                      Review round {event.revision_number}
                    </span>
                  </div>
                  {event.reason && (
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {event.reason}
                    </p>
                  )}
                  <ul className="space-y-2">
                    {event.changes.map((change, index) => (
                      <li key={index} className="break-words text-sm">
                        <span className="font-medium">
                          {change.department_name
                            ? `${change.department_name} · `
                            : ""}
                          {fieldLabels[change.field] ?? change.field}:{" "}
                        </span>
                        <span className="whitespace-pre-wrap">
                          {change.field === "submitted_at" &&
                          change.before !== null
                            ? formatBudgetTimestamp(String(change.before))
                            : change.before !== null &&
                                [
                                  "proposed_amount",
                                  "allocation",
                                  "reserve",
                                ].includes(change.field)
                              ? formatFinancialAmount(change.before)
                              : (change.before ?? "Not set")}
                        </span>
                        <span aria-label="changed to"> → </span>
                        <span className="whitespace-pre-wrap">
                          {change.field === "submitted_at" &&
                          change.after !== null
                            ? formatBudgetTimestamp(String(change.after))
                            : change.after !== null &&
                                [
                                  "proposed_amount",
                                  "allocation",
                                  "reserve",
                                ].includes(change.field)
                              ? formatFinancialAmount(change.after)
                              : (change.after ?? "Not set")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        </DialogContent>
      </Dialog>
      {!edit && (
        <p
          className="order-first min-w-0 space-y-1 text-sm text-muted-foreground"
          aria-live="polite"
        >
          <span className="block font-semibold text-foreground">
            Latest change
          </span>
          {latest ? (
            <>
              Latest: {latest.author_name} {actions[latest.action]}.
              {fields.length > 0 && (
                <>
                  {" "}
                  {fields.slice(0, 2).join(", ")}
                  {fields.length > 2 ? ` and ${fields.length - 2} more` : ""}.
                </>
              )}{" "}
              {formatBudgetTimestamp(latest.created_at)}
            </>
          ) : (
            "No proposal changes recorded in your scope."
          )}
        </p>
      )}
    </div>
  );
}
