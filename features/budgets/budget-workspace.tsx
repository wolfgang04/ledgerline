"use client";
import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { QueryState } from "@/components/query-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLeaveConfirmation } from "@/components/unsaved-changes";
import { useOrganizationsQuery } from "@/features/organizations/queries";
import type { Notify } from "@/components/notice";
import { BudgetDashboard } from "./budget-dashboard";
import { SpendingDashboard } from "./commitments/spending-dashboard";

export function BudgetWorkspace({
  organizationId,
  onNotice,
}: {
  organizationId: number;
  onNotice: Notify;
}) {
  const organizations = useOrganizationsQuery();
  const organization = organizations.data?.organizations.find(
    (item) => item.id === organizationId,
  );
  const annual = ["finance", "manager", "organization_admin"].includes(
    organization?.role ?? "",
  );
  const spending =
    organization?.role === "finance" ||
    (!!organization?.department_id &&
      ["employee", "manager"].includes(organization?.role ?? ""));
  const [tab, setTab] = useState("annual");
  const leave = useLeaveConfirmation();
  return (
    <DashboardShell
      title={`${organization?.name ?? "Organization"} · Budgets`}
      organizationId={organizationId}
    >
      <QueryState
        loading={organizations.isLoading}
        error={organizations.error}
        empty={
          !annual && !spending
            ? "Join a department to request spending. Finance or manager membership is required to review budgets."
            : undefined
        }
      >
        {annual && spending ? (
          <Tabs
            value={tab}
            onValueChange={(value) =>
              leave.request(() => setTab(String(value)))
            }
            className="space-y-5"
          >
            <TabsList className="group-data-horizontal/tabs:h-auto w-full flex-col items-stretch sm:w-fit sm:flex-row">
              <TabsTrigger className="min-h-11 px-4" value="annual">
                Annual proposals
              </TabsTrigger>
              <TabsTrigger className="min-h-11 px-4" value="spending">
                Spending &amp; commitments
              </TabsTrigger>
            </TabsList>
            <TabsContent value="annual">
              <BudgetDashboard
                organizationId={organizationId}
                onNotice={onNotice}
              />
            </TabsContent>
            <TabsContent value="spending">
              <SpendingDashboard
                organizationId={organizationId}
                role={organization!.role!}
                onNotice={onNotice}
              />
            </TabsContent>
          </Tabs>
        ) : annual ? (
          <BudgetDashboard
            organizationId={organizationId}
            onNotice={onNotice}
          />
        ) : spending ? (
          <SpendingDashboard
            organizationId={organizationId}
            role={organization!.role!}
            onNotice={onNotice}
          />
        ) : null}
      </QueryState>
    </DashboardShell>
  );
}
