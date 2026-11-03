"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { QueryState } from "@/components/query-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    <div className="space-y-5">
      <PageHeading
        title={
          selected === null
            ? "Budget proposals"
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
                    className="flex flex-wrap items-center justify-between gap-4 border-b py-4 transition-colors last:border-0 hover:bg-muted/30"
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
          )}
        </QueryState>
      </QueryState>
    </div>
  );
}
