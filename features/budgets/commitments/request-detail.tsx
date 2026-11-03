"use client";
import { useState, type FormEvent } from "react";
import { QueryState } from "@/components/query-state";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useUnsavedEditor,
  useLeaveConfirmation,
} from "@/components/unsaved-changes";
import type { Notify } from "@/components/notice";
import { getApiError } from "@/lib/api";
import { formatBudgetTimestamp, formatFinancialAmount } from "@/lib/budget";
import { useCommitmentDetail, useCommitmentMutation } from "./queries";
import type { RequestAction, RequestKind } from "./types";

const labels: Record<RequestAction, string> = {
  approve: "Approve request",
  reject: "Reject request",
  withdraw: "Withdraw request",
  cancel: "Cancel commitment",
};
export function RequestDetailPanel({
  organizationId,
  budgetId,
  kind,
  requestId,
  currency,
  active,
  onClose,
  onNotice,
}: {
  organizationId: number;
  budgetId: number;
  kind: RequestKind;
  requestId: number;
  currency: string;
  active: boolean;
  onClose: () => void;
  onNotice: Notify;
}) {
  const query = useCommitmentDetail(organizationId, budgetId, kind, requestId);
  const mutation = useCommitmentMutation(organizationId, budgetId);
  const [action, setAction] = useState<RequestAction | null>(null);
  const [reason, setReason] = useState("");
  const leave = useLeaveConfirmation();
  useUnsavedEditor(!!reason, mutation.isPending);
  const request = query.data?.request;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request || !action) return;
    mutation.mutate(
      {
        kind,
        requestId,
        action,
        version: request.version,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      },
      {
        onSuccess: () => {
          setAction(null);
          setReason("");
          onNotice({ type: "success", text: "Request updated." });
        },
      },
    );
  }
  return (
    <section
      className="space-y-5 rounded-xl border bg-card p-5 sm:p-6"
      aria-label="Request details"
    >
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" disabled={leave.pending} onClick={onClose}>
          Back to requests
        </Button>
        <Button
          variant="ghost"
          disabled={query.isFetching || mutation.isPending}
          onClick={() => {
            mutation.reset();
            void query.refetch();
          }}
        >
          Reload request
        </Button>
      </div>
      <QueryState loading={query.isLoading} error={query.error}>
        {request && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <h2 className="break-words text-xl font-semibold">
                  {request.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {request.allocated_to_user_id !== null
                    ? `Allocated by ${request.author_name}`
                    : request.author_name}{" "}
                  · {formatBudgetTimestamp(request.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {request.allocated_to_user_id !== null && (
                  <Badge>Manager allocation</Badge>
                )}
                <Badge>{request.status}</Badge>
              </div>
            </div>
            <dl className="flex flex-wrap gap-x-10 gap-y-4 border-y py-4 text-sm">
              <div>
                <dt className="text-muted-foreground">
                  {request.allocated_to_user_id !== null
                    ? "Allocated amount"
                    : "Requested amount"}
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">
                  {formatFinancialAmount(request.amount)} {currency}
                </dd>
              </div>
              {request.allocated_to_user_id !== null && (
                <div>
                  <dt className="text-muted-foreground">Recipient</dt>
                  <dd className="mt-1 break-words">
                    {request.allocated_to_name}
                  </dd>
                </div>
              )}
              {kind === "spending" && (
                <div>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="mt-1">{request.category ?? "Unplanned"}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">
                  {request.status === "pending"
                    ? "Next approver"
                    : "Approval route"}
                </dt>
                <dd className="mt-1">
                  {request.approval_role === "finance"
                    ? "Finance"
                    : "Department manager"}
                </dd>
              </div>
            </dl>
            <p className="max-w-prose whitespace-pre-wrap break-words text-sm leading-relaxed">
              {request.justification}
            </p>
            {!active && request.status === "pending" && (
              <Alert>
                This budget is no longer active. New approvals are unavailable.
              </Alert>
            )}
            {mutation.error && (
              <Alert variant="destructive">{getApiError(mutation.error)}</Alert>
            )}
            {!action && (
              <div className="flex flex-wrap gap-3">
                {(Object.keys(labels) as RequestAction[])
                  .filter(
                    (item) =>
                      request.actions[item] && (item !== "approve" || active),
                  )
                  .map((item) => (
                    <Button
                      key={item}
                      variant={item === "approve" ? "default" : "outline"}
                      disabled={mutation.isPending}
                      onClick={() => setAction(item)}
                    >
                      {labels[item]}
                    </Button>
                  ))}
              </div>
            )}
            {action && (
              <form
                onSubmit={submit}
                className="max-w-2xl space-y-4 border-t pt-5"
              >
                <h3 className="font-semibold">{labels[action]}</h3>
                <p className="text-sm text-muted-foreground">
                  {action === "approve"
                    ? kind === "funding"
                      ? "Transfer the full amount from the organization reserve. Spending still requires a separate approval."
                      : "Authorize the full amount and add it to committed spending. This does not record a payment."
                    : action === "cancel"
                      ? "Release the full committed amount. The original approval remains in the history."
                      : action === "withdraw"
                        ? "Withdraw this pending request. Submit a new request if its details need to change."
                        : "Reject this pending request and explain what needs to change."}
                </p>
                {(action === "reject" || action === "cancel") && (
                  <div className="space-y-2">
                    <Label htmlFor="decision-reason">Reason</Label>
                    <textarea
                      id="decision-reason"
                      required
                      maxLength={1000}
                      rows={3}
                      value={reason}
                      disabled={mutation.isPending}
                      onChange={(event) => setReason(event.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    variant={
                      action === "reject" || action === "cancel"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {mutation.isPending
                      ? "Saving…"
                      : `Confirm ${action === "cancel" ? "cancellation" : action === "withdraw" ? "withdrawal" : action === "reject" ? "rejection" : "approval"}`}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={mutation.isPending}
                    onClick={() =>
                      leave.request(() => {
                        setAction(null);
                        setReason("");
                        mutation.reset();
                      })
                    }
                  >
                    Keep request unchanged
                  </Button>
                </div>
              </form>
            )}
            <div className="space-y-3 border-t pt-5">
              <h3 className="font-semibold">
                {request.allocated_to_user_id !== null
                  ? "Allocation history"
                  : "Request history"}
              </h3>
              <ol className="divide-y">
                {query.data?.history.map((event) => (
                  <li key={event.id} className="space-y-1 py-3 text-sm">
                    <p>
                      <span className="font-medium capitalize">
                        {request.allocated_to_user_id !== null &&
                        event.from_status === null &&
                        event.to_status === "approved"
                          ? "Allocated"
                          : event.to_status === "pending"
                            ? "Submitted"
                            : event.to_status}
                      </span>{" "}
                      · {event.author_name}
                    </p>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={event.created_at}
                    >
                      {formatBudgetTimestamp(event.created_at)}
                    </time>
                    {event.reason && (
                      <p className="whitespace-pre-wrap break-words">
                        {event.reason}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </QueryState>
    </section>
  );
}
