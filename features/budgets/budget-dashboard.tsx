"use client";
import { Plus } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { QueryState } from "@/components/query-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { Notify } from "@/components/notice";
import { getApiError } from "@/lib/api";
import { formatFinancialAmount, currencyLabel } from "@/lib/budget";
import { useOrganizationsQuery } from "@/features/organizations/queries";
import {
  useBudgetMutation,
  useBudgetPlans,
  useFinancialSettings,
} from "./queries";
import { FinancialSettingsForm } from "./financial-settings-form";
import { NewProposal } from "./new-proposal";
import { ProposalDetailPanel } from "./proposal-detail";
import { useBudgetLocation } from "./use-budget-location";

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
  const location = useBudgetLocation();
  const proposal = location.params.get("proposal");
  const proposalId = Number(proposal);
  const selected =
    proposal === "new"
      ? "new"
      : Number.isSafeInteger(proposalId) && proposalId > 0
        ? proposalId
        : null;
  const setSelected = (value: number | "new" | null) =>
    location.update({ proposal: value });
  const settings = settingsQuery.data?.settings;
  const ready = !!settings?.currency && !!settings.fiscal_year_start_month;
  return (
    <div className="space-y-5">
      <PageHeading
        title={
          selected === null
            ? "Budget planning"
            : selected === "new"
              ? "New annual proposal"
              : (plansQuery.data?.plans.find((plan) => plan.id === selected)
                  ?.name ?? "Proposal")
        }
        description="Plan allocations, review department spending, and follow each proposal through approval."
        action={
          finance && ready && selected === null ? (
            <Button onClick={() => setSelected("new")}>
              <Plus />
              Create annual proposal
            </Button>
          ) : undefined
        }
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
          {settings && selected === null && (
            <details
              open={!ready}
              className="rounded-xl border bg-card p-4 text-sm"
            >
              <summary className="cursor-pointer font-medium">
                Financial settings
                {ready
                  ? ` \u00b7 ${settings.currency} \u00b7 FY starts ${new Date(Date.UTC(2000, settings.fiscal_year_start_month! - 1, 1)).toLocaleDateString("en", { month: "long", timeZone: "UTC" })}`
                  : " \u00b7 Setup required"}
              </summary>
              <div className="pt-5">
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
              </div>
            </details>
          )}
          {!ready && finance && (
            <Alert>
              Complete financial setup before creating or submitting proposals.
            </Alert>
          )}
          {selected !== null && settings && (
            <section className="space-y-5" aria-label="Selected proposal">
              <div>
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
              </div>
            </section>
          )}
          {selected === null && (
            <section
              className="workspace-panel"
              aria-labelledby="annual-proposals-heading"
            >
              <div className="panel-heading">
                <h2 id="annual-proposals-heading">Annual proposals</h2>
                <span className="text-xs text-muted-foreground">
                  {plansQuery.data?.plans.length ?? 0} proposals
                </span>
              </div>
              {!plansQuery.data?.plans.length ? (
                <p className="p-5 text-sm text-muted-foreground">
                  {finance
                    ? "No annual proposals yet. Create a proposal to plan department allocations."
                    : "No submitted proposals available for review."}
                </p>
              ) : (
                <Table
                  aria-label="Annual proposal register"
                  className="proposal-register"
                >
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proposal</TableHead>
                      <TableHead>Fiscal year</TableHead>
                      <TableHead className="text-right">
                        Annual amount ({settings?.currency})
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plansQuery.data?.plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="max-w-72 whitespace-normal break-words font-medium">
                          {plan.name}
                        </TableCell>
                        <TableCell data-label="Fiscal year">
                          FY {plan.fiscal_year}
                        </TableCell>
                        <TableCell
                          data-label="Annual amount"
                          className="text-right tabular-nums"
                        >
                          {plan.proposed_amount === null
                            ? "Scoped to department"
                            : formatFinancialAmount(plan.proposed_amount)}
                        </TableCell>
                        <TableCell data-label="Status">
                          <Badge
                            variant={
                              plan.status === "approved"
                                ? "success"
                                : plan.status === "under_review"
                                  ? "warning"
                                  : plan.status === "rejected"
                                    ? "destructive"
                                    : "default"
                            }
                          >
                            {plan.status.replaceAll("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            onClick={() => setSelected(plan.id)}
                          >
                            Open proposal
                            <span className="sr-only"> {plan.name}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          )}
        </QueryState>
      </QueryState>
    </div>
  );
}
