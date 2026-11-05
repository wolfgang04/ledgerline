"use client";
import type { Notify } from "@/components/notice";
import { PageHeading } from "@/components/page-heading";
import { QueryState } from "@/components/query-state";
import { Badge } from "@/components/ui/badge";
import { getApiError } from "@/lib/api";
import { currencyLabel } from "@/lib/budget";
import { useOrganizationsQuery } from "@/features/organizations/queries";
import { useFinancialSettings, useBudgetMutation } from "./queries";
import { FinancialSettingsForm } from "./financial-settings-form";

export function FinancialSettings({
  organizationId,
  onNotice,
}: {
  organizationId: number;
  onNotice: Notify;
}) {
  const organizations = useOrganizationsQuery();
  const role = organizations.data?.organizations.find(
    (item) => item.id === organizationId,
  )?.role;
  const allowed = ["finance", "organization_admin", "manager"].includes(
    role ?? "",
  );
  const query = useFinancialSettings(organizationId, allowed);
  const mutation = useBudgetMutation(organizationId);
  const settings = query.data?.settings;
  const editable =
    (role === "finance" || role === "organization_admin") && !settings?.locked;
  return (
    <div className="space-y-6">
      <PageHeading
        title="Financial settings"
        description="Set the currency and fiscal calendar used throughout this organization."
      />
      <QueryState
        loading={organizations.isLoading || query.isLoading}
        error={query.error}
        retry={() => void query.refetch()}
        empty={
          !allowed
            ? "Financial settings require Finance, manager, or administrator membership."
            : undefined
        }
      >
        {settings && (
          <section className="workspace-panel max-w-3xl">
            <div className="panel-heading">
              <h2>Currency & fiscal year</h2>
              <Badge>
                {settings.locked
                  ? "Locked"
                  : editable
                    ? "Editable"
                    : "Read only"}
              </Badge>
            </div>
            <div className="space-y-5 p-5">
              <p className="max-w-prose text-sm text-muted-foreground">
                These settings lock when the first proposal is created, keeping
                annual plans and approved records consistent.
              </p>
              {editable ? (
                <FinancialSettingsForm
                  key={`${settings.currency}-${settings.fiscal_year_start_month}`}
                  settings={settings}
                  currencies={query.data?.currencies ?? []}
                  pending={mutation.isPending}
                  onSave={(values) =>
                    mutation.mutate(
                      { kind: "settings", settings: values },
                      {
                        onSuccess: () =>
                          onNotice({
                            type: "success",
                            text: "Financial settings saved.",
                          }),
                        onError: (error) =>
                          onNotice({ type: "error", text: getApiError(error) }),
                      },
                    )
                  }
                />
              ) : (
                <dl className="divide-y">
                  <div className="flex flex-wrap justify-between gap-3 py-4">
                    <dt className="text-muted-foreground">Currency</dt>
                    <dd className="font-medium">
                      {settings.currency
                        ? currencyLabel(settings.currency)
                        : "Not configured"}
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-3 py-4">
                    <dt className="text-muted-foreground">
                      Fiscal year starts
                    </dt>
                    <dd className="font-medium">
                      {settings.fiscal_year_start_month
                        ? new Date(
                            Date.UTC(
                              2000,
                              settings.fiscal_year_start_month - 1,
                              1,
                            ),
                          ).toLocaleDateString("en", {
                            month: "long",
                            timeZone: "UTC",
                          })
                        : "Not configured"}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </section>
        )}
      </QueryState>
    </div>
  );
}
