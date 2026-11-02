"use client";
import { useState } from "react";
import type { Notify } from "@/components/notice";
import { QueryState } from "@/components/query-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeaveConfirmation } from "@/components/unsaved-changes";
import { getApiError } from "@/lib/api";
import { formatBudgetTimestamp, latestProposalDetail } from "@/lib/budget";
import { useSession } from "@/features/auth/session-provider";
import type { FinancialSettings } from "./types";
import {
  useBudgetPlan,
  useBudgetConversation,
  useBudgetMutation,
} from "./queries";
import { ProposalForm } from "./proposal-form";
import { ProposalDialogs, type ProposalDialogAction } from "./proposal-dialogs";
import { AllocationSummary } from "./allocation-summary";
import { ChangeHistory } from "./change-history";
import { ReviewConversations } from "./review-conversations";
import { BudgetReviewPanel } from "./budget-review";
import { ProposalOverview } from "./proposal-overview";

export function ProposalDetailPanel({
  organizationId,
  planId,
  settings,
  finance,
  manager,
  admin,
  onNotice,
  onClose,
}: {
  organizationId: number;
  planId: number;
  settings: FinancialSettings;
  finance: boolean;
  manager: boolean;
  admin: boolean;
  onNotice: Notify;
  onClose: () => void;
}) {
  const query = useBudgetPlan(organizationId, planId);
  const mutation = useBudgetMutation(organizationId);
  const { user } = useSession();
  const leave = useLeaveConfirmation();
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState<ProposalDialogAction>(null);
  const detail = query.data;
  const conversation = useBudgetConversation(organizationId, planId, detail);
  const live = latestProposalDetail(detail, conversation.data);
  const shown = live ?? detail;
  const unallocated =
    shown?.departments.filter(
      (department) =>
        department.eligible &&
        !shown.working.allocations.some(
          (allocation) => allocation.department_id === department.id,
        ),
    ) ?? [];
  const allApproved = shown?.approval_stage === "ready_to_commit";
  const canEdit =
    finance &&
    !!detail &&
    ["draft", "changes_requested", "revising"].includes(
      editing ? detail.plan.status : (shown?.plan.status ?? detail.plan.status),
    );
  const error = (value: unknown) =>
    onNotice({ type: "error", text: getApiError(value) });
  async function openEditor() {
    const result = await query.refetch();
    if (result.error) error(result.error);
    else setEditing(true);
  }
  async function reloadSavedProposal() {
    const result = await query.refetch();
    if (result.error) error(result.error);
    else {
      setReload((value) => value + 1);
      setEditing(false);
    }
  }
  return (
    <QueryState loading={query.isLoading} error={query.error}>
      {detail && (
        <div className="space-y-6">
          {shown && (
            <ProposalOverview
              snapshot={
                shown.committed_budget?.snapshot ??
                (shown.plan.status === "under_review"
                  ? (shown.revisions[0]?.snapshot ?? shown.working)
                  : shown.working)
              }
            />
          )}
          {finance && unallocated.length > 0 && !shown?.committed_budget && (
            <Alert variant="warning">
              <p className="font-semibold">
                Eligible departments have no budget allocation
              </p>
              <p>
                {unallocated.map((department) => department.name).join(", ")}{" "}
                now have department managers. Finance can add them to this
                proposal.
              </p>
              <Button
                className="mt-2"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => {
                  if (shown?.plan.status === "under_review")
                    setDialog("revision");
                  else void openEditor();
                }}
              >
                {shown?.plan.status === "under_review"
                  ? "Start revision to add departments"
                  : "Edit department inclusion"}
              </Button>
            </Alert>
          )}
          <div className="flex flex-wrap items-center gap-3 border-b pb-5">
            <Badge>
              {shown?.approval_stage === "active"
                ? "Active"
                : allApproved
                  ? "Approved, awaiting commitment"
                  : (live ?? detail).plan.status.replaceAll("_", " ")}
            </Badge>
            <span className="text-sm">
              {(live ?? detail).plan.revision_number
                ? `Submitted version ${(live ?? detail).plan.revision_number}`
                : "Not yet submitted"}
            </span>
            {!!detail.plan.revision_number && (
              <section className="space-y-3" aria-label="Review conversations">
                <ReviewConversations
                  detail={live ?? detail}
                  onRefresh={() => {
                    void conversation.refetch();
                  }}
                  refreshing={conversation.isFetching}
                  refreshError={
                    conversation.error
                      ? getApiError(conversation.error)
                      : undefined
                  }
                  manager={manager}
                  userId={user?.id ?? 0}
                  readOnly={admin}
                  pending={mutation.isPending}
                  onMessage={async (values) => {
                    try {
                      await mutation.mutateAsync({
                        kind: "message",
                        planId,
                        values,
                      });
                      onNotice({
                        type: "success",
                        text: "Review message recorded.",
                      });
                    } catch (value) {
                      error(value);
                      throw value;
                    }
                  }}
                />
              </section>
            )}
            {finance && shown?.plan.status === "under_review" && (
              <Button
                disabled={mutation.isPending}
                onClick={() => setDialog("revision")}
              >
                Start revision
              </Button>
            )}
            {canEdit && shown && (
              <div className="space-y-2">
                <Button
                  disabled={
                    mutation.isPending ||
                    editing ||
                    !["draft", "changes_requested", "revising"].includes(
                      shown.plan.status,
                    ) ||
                    !shown.working.proposed_amount ||
                    shown.working.reserve === null ||
                    shown.working.reserve.startsWith("-")
                  }
                  onClick={() => setDialog("submit")}
                >
                  {shown.plan.revision_number
                    ? "Resubmit for review"
                    : "Submit for review"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {editing
                    ? "Save or cancel your edits before submitting."
                    : shown.working.reserve?.startsWith("-")
                      ? "Allocations exceed the annual total. Edit and save corrected values first."
                      : "Submit saved values for a fresh review. Prior requester agreement is not required."}
                </p>
              </div>
            )}
            {canEdit && !editing && (
              <Button
                disabled={mutation.isPending}
                onClick={() => void openEditor()}
              >
                Edit proposal
              </Button>
            )}
            <Button
              variant="outline"
              disabled={mutation.isPending || leave.pending}
              onClick={() => leave.request(() => void reloadSavedProposal())}
            >
              Reload saved proposal
            </Button>
            <Button
              variant="ghost"
              disabled={mutation.isPending || leave.pending}
              onClick={() => leave.request(onClose)}
            >
              Close proposal
            </Button>
          </div>
          {shown && !editing && (
            <BudgetReviewPanel
              detail={shown}
              manager={manager}
              finance={finance}
              userId={user?.id}
              pending={mutation.isPending}
              onSaveSpendingPlan={async (departmentId, values) => {
                await mutation.mutateAsync({
                  kind: "save-spending-plan",
                  planId,
                  departmentId,
                  values,
                });
                onNotice({
                  type: "success",
                  text: "Spending plan saved and visible to Finance.",
                });
              }}
              onApprove={() =>
                mutation.mutate(
                  {
                    kind: "approve",
                    planId,
                    updated_at: shown.plan.updated_at,
                  },
                  {
                    onError: error,
                    onSuccess: () =>
                      onNotice({
                        type: "success",
                        text: "Approval recorded for the submitted version.",
                      }),
                  },
                )
              }
              onCommit={() => setDialog("commit")}
            />
          )}
          {canEdit &&
          editing &&
          settings.currency &&
          settings.fiscal_year_start_month ? (
            <ProposalForm
              key={`${detail.plan.updated_at}-${reload}`}
              plan={detail.plan}
              allocations={detail.working.allocations}
              departments={shown?.departments ?? detail.departments}
              currency={settings.currency}
              month={settings.fiscal_year_start_month}
              pending={mutation.isPending}
              onCancel={() => setEditing(false)}
              onSave={(values, reason) =>
                mutation.mutate(
                  {
                    kind: "update",
                    planId,
                    updated_at: detail.plan.updated_at,
                    values,
                    reason,
                  },
                  {
                    onError: error,
                    onSuccess: () => {
                      setEditing(false);
                      setReload((value) => value + 1);
                      onNotice({
                        type: "success",
                        text: "Working proposal saved. Resubmit when ready for review.",
                      });
                    },
                  },
                )
              }
            />
          ) : (
            <details className="space-y-4 border-t pt-5">
              <summary className="cursor-pointer font-semibold">
                {["changes_requested", "revising"].includes(detail.plan.status)
                  ? "Current working values — not yet resubmitted"
                  : "Proposal values"}
              </summary>
              <AllocationSummary
                snapshot={
                  shown?.plan.status === "under_review"
                    ? (shown.revisions[0]?.snapshot ?? shown.working)
                    : (shown?.working ?? detail.working)
                }
              />
              {shown &&
                ["changes_requested", "revising"].includes(shown.plan.status) &&
                shown.revisions[0] && (
                  <details className="rounded-xl border p-4">
                    <summary className="cursor-pointer font-medium">
                      Last submitted version{" "}
                      {shown.revisions[0].revision_number}
                    </summary>
                    <AllocationSummary snapshot={shown.revisions[0].snapshot} />
                  </details>
                )}
              {canEdit && (
                <p className="text-sm text-muted-foreground">
                  These are saved working values. Edit proposal to change them,
                  or use Submit/Resubmit for review above.
                </p>
              )}
            </details>
          )}
          {shown?.committed_budget?.snapshot && (
            <section
              aria-label="Committed budget"
              className="space-y-3 border-t pt-5"
            >
              <h3 className="font-semibold">
                Committed budget · Version{" "}
                {shown.committed_budget.revision_number}
              </h3>
              <p className="text-sm">
                Department budgets are active.{" "}
                {shown.committed_budget.approved_at &&
                  formatBudgetTimestamp(shown.committed_budget.approved_at)}
              </p>
              <details className="space-y-4">
                <summary className="cursor-pointer text-sm font-medium">
                  View committed allocation record
                </summary>
                <AllocationSummary snapshot={shown.committed_budget.snapshot} />
              </details>
            </section>
          )}
          <ChangeHistory detail={live ?? detail} />
          {live && live.plan.updated_at !== detail.plan.updated_at && (
            <Alert>
              New proposal changes are available. Reload when ready; your local
              edits are preserved.
            </Alert>
          )}

          {shown && (
            <ProposalDialogs
              mutation={mutation}
              shown={shown}
              action={dialog}
              onActionChange={setDialog}
              onRevision={() => setEditing(true)}
              onNotice={onNotice}
            />
          )}
          {!!(live ?? detail).revisions.length && (
            <section className="space-y-3" aria-label="Submitted versions">
              <h3 className="font-semibold">Submitted versions</h3>
              {(live ?? detail).revisions.map((revision) => (
                <details
                  key={revision.id}
                  className="space-y-3 rounded-lg border p-4"
                >
                  <summary className="cursor-pointer font-medium">
                    Version {revision.revision_number} ·{" "}
                    {formatBudgetTimestamp(revision.created_at)} ·{" "}
                    {revision.author_name}
                  </summary>
                  <p className="whitespace-pre-wrap break-words py-3 text-sm">
                    {revision.summary}
                  </p>
                  <AllocationSummary snapshot={revision.snapshot} />
                </details>
              ))}
            </section>
          )}
        </div>
      )}
    </QueryState>
  );
}
