"use client";
import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeading } from "@/components/page-heading";
import { QueryState } from "@/components/query-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Notify } from "@/components/notice";
import { getApiError } from "@/lib/api";
import {
  formatFinancialAmount,
  currencyLabel,
  formatBudgetTimestamp,
  latestProposalDetail,
} from "@/lib/budget";
import { useSession } from "@/features/auth/session-provider";
import { useOrganizationsQuery } from "@/features/organizations/queries";
import { useOrganizationStructureQuery } from "@/features/organizations/structure-queries";
import {
  useBudgetMutation,
  useBudgetPlan,
  useBudgetConversation,
  useBudgetPlans,
  useFinancialSettings,
  type FinancialSettings,
} from "./queries";
import { FinancialSettingsForm } from "./financial-settings-form";
import { ProposalForm } from "./proposal-form";
import { AllocationSummary } from "./allocation-summary";
import { ReviewConversations } from "./review-conversations";
import { ChangeHistory } from "./change-history";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function NewProposal({
  organizationId,
  settings,
  onNotice,
  onCreated,
  onClose,
}: {
  organizationId: number;
  settings: FinancialSettings;
  onNotice: Notify;
  onCreated: (id: number) => void;
  onClose: () => void;
}) {
  const structure = useOrganizationStructureQuery(organizationId);
  const mutation = useBudgetMutation(organizationId);
  return (
    <QueryState loading={structure.isLoading} error={structure.error}>
      <ProposalForm
        allocations={(structure.data?.departments ?? []).map((department) => ({
          department_id: department.id,
          name: department.name,
          proposed_amount: "0.00",
        }))}
        currency={settings.currency!}
        month={settings.fiscal_year_start_month!}
        pending={mutation.isPending}
        onCancel={onClose}
        onSubmit={() => {}}
        onSave={(values) =>
          mutation.mutate(
            { kind: "create", values },
            {
              onError: (error) =>
                onNotice({ type: "error", text: getApiError(error) }),
              onSuccess: (plan) => {
                if (plan) onCreated(plan.id);
                onNotice({ type: "success", text: "Draft saved." });
              },
            },
          )
        }
      />
    </QueryState>
  );
}

function ProposalDetailPanel({
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
  const [reload, setReload] = useState(0);
  const [revisionDialog, setRevisionDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const detail = query.data;
  const conversation = useBudgetConversation(organizationId, planId, detail);
  const live = latestProposalDetail(detail, conversation.data);
  const canEdit =
    finance &&
    !!detail &&
    ["draft", "changes_requested", "revising"].includes(detail.plan.status);
  const error = (value: unknown) =>
    onNotice({ type: "error", text: getApiError(value) });
  return (
    <QueryState loading={query.isLoading} error={query.error}>
      {detail && (
        <div className="space-y-6">
          <ChangeHistory detail={live ?? detail} />
          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 p-4">
            <Badge>{(live ?? detail).plan.status.replaceAll("_", " ")}</Badge>
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
            {finance && detail.plan.status === "under_review" && (
              <Button
                disabled={mutation.isPending}
                onClick={() => setRevisionDialog(true)}
              >
                Start revision
              </Button>
            )}
            {canEdit && !editing && (
              <Button
                disabled={mutation.isPending}
                onClick={() => setEditing(true)}
              >
                Edit proposal
              </Button>
            )}
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={async () => {
                const result = await query.refetch();
                if (result.error) error(result.error);
                else {
                  setReload((value) => value + 1);
                  setEditing(false);
                }
              }}
            >
              Reload and discard local edits
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close proposal
            </Button>
          </div>
          {canEdit &&
          editing &&
          settings.currency &&
          settings.fiscal_year_start_month ? (
            <ProposalForm
              key={`${detail.plan.updated_at}-${reload}`}
              plan={detail.plan}
              allocations={detail.working.allocations}
              currency={settings.currency}
              month={settings.fiscal_year_start_month}
              pending={mutation.isPending}
              blocked={
                live?.plan.updated_at !== detail.plan.updated_at ||
                (live?.messages ?? detail.messages).some(
                  (message) =>
                    message.kind === "request_changes" &&
                    message.revision_number === detail.plan.revision_number &&
                    !message.agreed,
                )
              }
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
                        text:
                          detail.plan.status === "revising"
                            ? "Revision saved and submitted for review."
                            : "Working proposal saved.",
                      });
                    },
                  },
                )
              }
              onSubmit={(summary) =>
                mutation.mutate(
                  {
                    kind: "submit",
                    planId,
                    updated_at: detail.plan.updated_at,
                    summary,
                  },
                  {
                    onError: error,
                    onSuccess: () => {
                      setEditing(false);
                      onNotice({
                        type: "success",
                        text: "Proposal submitted for review.",
                      });
                    },
                  },
                )
              }
            />
          ) : (
            <>
              <h3 className="font-semibold">
                {["changes_requested", "revising"].includes(detail.plan.status)
                  ? "Current working values — not yet resubmitted"
                  : "Proposal values"}
              </h3>
              <AllocationSummary snapshot={detail.working} />
              {canEdit && (
                <p className="text-sm text-muted-foreground">
                  Proposal is locked for viewing. Select Edit proposal to change
                  values or submit for review.
                </p>
              )}
            </>
          )}
          {live && live.plan.updated_at !== detail.plan.updated_at && (
            <Alert>
              New proposal changes are available. Reload when ready; your local
              edits are preserved.
            </Alert>
          )}

          <Dialog open={revisionDialog} onOpenChange={setRevisionDialog}>
            <DialogContent>
              <DialogTitle>Start a finance revision</DialogTitle>
              <DialogDescription>
                The submitted version remains unchanged. Saved edits will be
                audited, and any existing change requests still require
                requester agreement.
              </DialogDescription>
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const reason = String(
                    new FormData(event.currentTarget).get("reason"),
                  );
                  mutation.mutate(
                    {
                      kind: "start-revision",
                      planId,
                      updated_at: detail.plan.updated_at,
                      reason,
                    },
                    {
                      onError: error,
                      onSuccess: () => {
                        setRevisionDialog(false);
                        setEditing(true);
                        onNotice({
                          type: "success",
                          text: "Finance revision started.",
                        });
                      },
                    },
                  );
                }}
              >
                <Label htmlFor="revision-reason">Reason for revision</Label>
                <textarea
                  id="revision-reason"
                  name="reason"
                  required
                  maxLength={1000}
                  rows={3}
                  disabled={mutation.isPending}
                  className="w-full rounded-lg border bg-card p-3"
                />
                <Button type="submit" disabled={mutation.isPending}>
                  Start revision and record reason
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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

export function BudgetDashboard({
  organizationId,
  onNotice,
}: {
  organizationId: number;
  onNotice: Notify;
}) {
  const organizations = useOrganizationsQuery();
  const organization = organizations.data?.organizations.find(
    ({ id }) => id === organizationId,
  );
  const finance = organization?.role === "finance";
  const admin = organization?.role === "organization_admin";
  const manager = organization?.role === "manager";
  const allowed = finance || admin || manager;
  const settingsQuery = useFinancialSettings(organizationId, allowed);
  const plansQuery = useBudgetPlans(organizationId, allowed);
  const mutation = useBudgetMutation(organizationId);
  const [selected, setSelected] = useState<number | "new" | null>(null);
  const settings = settingsQuery.data?.settings;
  const ready = !!settings?.currency && !!settings.fiscal_year_start_month;
  return (
    <DashboardShell
      title={`${organization?.name ?? "Organization"} · Budgets`}
      organizationId={organizationId}
    >
      <PageHeading
        eyebrow="Annual planning"
        title="Budget proposals"
        description="Allocate the financial year and agree on revisions together."
      />
      <QueryState
        loading={organizations.isLoading}
        error={organizations.error}
        empty={
          !allowed
            ? "Budget access requires finance, organization admin, or manager membership."
            : undefined
        }
      >
        <QueryState
          loading={settingsQuery.isLoading || plansQuery.isLoading}
          error={settingsQuery.error ?? plansQuery.error}
        >
          {settings && (
            <Card>
              <CardHeader>
                <CardTitle>Financial settings</CardTitle>
              </CardHeader>
              <CardContent>
                {(finance || admin) && !settings.locked ? (
                  <FinancialSettingsForm
                    key={`${settings.currency}-${settings.fiscal_year_start_month}`}
                    settings={settings}
                    currencies={settingsQuery.data?.currencies ?? []}
                    pending={mutation.isPending}
                    onSave={(values) =>
                      mutation.mutate(
                        { kind: "settings", settings: values },
                        {
                          onError: (error) =>
                            onNotice({
                              type: "error",
                              text: getApiError(error),
                            }),
                          onSuccess: () =>
                            onNotice({
                              type: "success",
                              text: "Financial settings saved.",
                            }),
                        },
                      )
                    }
                  />
                ) : (
                  <p>
                    {ready
                      ? `${currencyLabel(settings.currency!)} · Financial year starts in ${new Date(Date.UTC(2000, settings.fiscal_year_start_month! - 1, 1)).toLocaleDateString("en", { month: "long", timeZone: "UTC" })}.${settings.locked ? " Settings are locked." : ""}`
                      : "Finance or an administrator must complete financial setup."}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          {!ready && finance && (
            <Alert>
              Complete financial setup before creating or submitting proposals.
            </Alert>
          )}
          {finance && ready && selected === null && (
            <Button onClick={() => setSelected("new")}>
              Create annual proposal
            </Button>
          )}
          {selected !== null && settings && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selected === "new"
                    ? "New annual proposal"
                    : (plansQuery.data?.plans.find(
                        (plan) => plan.id === selected,
                      )?.name ?? "Proposal")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selected === "new" && ready ? (
                  <NewProposal
                    organizationId={organizationId}
                    settings={settings}
                    onNotice={onNotice}
                    onCreated={setSelected}
                    onClose={() => setSelected(null)}
                  />
                ) : (
                  typeof selected === "number" && (
                    <ProposalDetailPanel
                      key={selected}
                      organizationId={organizationId}
                      planId={selected}
                      settings={settings}
                      finance={finance}
                      manager={manager}
                      admin={admin}
                      onNotice={onNotice}
                      onClose={() => setSelected(null)}
                    />
                  )
                )}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Annual proposals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!plansQuery.data?.plans.length && (
                <p className="text-sm text-muted-foreground">
                  {finance
                    ? "No annual proposals yet."
                    : "No submitted proposals available for review."}
                </p>
              )}
              {plansQuery.data?.plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      FY {plan.fiscal_year}
                      {plan.proposed_amount !== null
                        ? ` · ${settings?.currency ?? ""} ${formatFinancialAmount(plan.proposed_amount)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{plan.status.replaceAll("_", " ")}</Badge>
                    <Button
                      variant="outline"
                      onClick={() => setSelected(plan.id)}
                    >
                      {selected === plan.id ? "Viewing" : "Open proposal"}
                      <span className="sr-only"> {plan.name}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </QueryState>
      </QueryState>
    </DashboardShell>
  );
}
