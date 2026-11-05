"use client";
import Link from "next/link";
import { ArrowRight, CheckCheck } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { QueryState } from "@/components/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useOrganizationsQuery } from "@/features/organizations/queries";
import {
  financialPercentage,
  formatFinancialAmount,
  sumFinancialAmounts,
} from "@/lib/budget";
import { useBudgetPlans } from "./queries";
import { useBudgetLocation } from "./use-budget-location";
import {
  useCommitmentBudgets,
  useCommitmentOverview,
  useCommitmentRequests,
} from "./commitments/queries";
import { DepartmentBalances } from "./department-balances";
import type { CommitmentRequest } from "./commitments/types";

export function FinancialOverview({
  organizationId,
}: {
  organizationId: number;
}) {
  const organizations = useOrganizationsQuery();
  const organization = organizations.data?.organizations.find(
    (item) => item.id === organizationId,
  );
  const allowed =
    organization?.role === "finance" ||
    (organization?.role === "manager" && !!organization.department_id);
  return (
    <QueryState
      loading={organizations.isLoading}
      error={organizations.error}
      empty={
        !allowed
          ? "This overview is available to Finance and assigned department managers."
          : undefined
      }
    >
      {allowed && (
        <OverviewBudgets
          organizationId={organizationId}
          finance={organization?.role === "finance"}
        />
      )}
    </QueryState>
  );
}

function OverviewBudgets({
  organizationId,
  finance,
}: {
  organizationId: number;
  finance: boolean;
}) {
  const budgets = useCommitmentBudgets(organizationId);
  const location = useBudgetLocation();
  const selected =
    budgets.data?.budgets.find(
      (item) => String(item.fiscal_year) === location.params.get("year"),
    ) ??
    budgets.data?.budgets.find((item) => item.status === "active") ??
    budgets.data?.budgets[0];
  return (
    <div className="space-y-6">
      <PageHeading
        title={finance ? "Financial overview" : "Department overview"}
        description="Your approved budget, authorized spending, and the decisions that need you."
        action={
          <Button
            variant="outline"
            render={<Link href={`/organizations/${organizationId}/budgets`} />}
          >
            Budget planning
            <ArrowRight />
          </Button>
        }
      />
      <QueryState
        loading={budgets.isLoading}
        error={budgets.error}
        retry={() => void budgets.refetch()}
        empty={
          budgets.data && !selected
            ? "No approved budget is available yet. Activate an annual proposal to start tracking commitments."
            : undefined
        }
        action={
          <Button
            render={<Link href={`/organizations/${organizationId}/budgets`} />}
          >
            View annual proposals
          </Button>
        }
      >
        {selected && (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full space-y-2 sm:w-64">
                <Label htmlFor="overview-year">Budget year</Label>
                <Select
                  value={String(selected.fiscal_year)}
                  items={Object.fromEntries(
                    (budgets.data?.budgets ?? []).map((item) => [
                      String(item.fiscal_year),
                      `FY ${item.fiscal_year}`,
                    ]),
                  )}
                  onValueChange={(value) =>
                    value && location.update({ year: value })
                  }
                >
                  <SelectTrigger id="overview-year" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {budgets.data?.budgets.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={String(item.fiscal_year)}
                      >
                        FY {item.fiscal_year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge
                variant={selected.status === "active" ? "success" : "default"}
                className="mb-2 capitalize"
              >
                {selected.status}
              </Badge>
            </div>
            <BudgetPosition
              key={selected.id}
              organizationId={organizationId}
              budgetId={selected.id}
              finance={finance}
            />
          </>
        )}
      </QueryState>
    </div>
  );
}

function BudgetPosition({
  organizationId,
  budgetId,
  finance,
}: {
  organizationId: number;
  budgetId: number;
  finance: boolean;
}) {
  const overview = useCommitmentOverview(organizationId, budgetId);
  const spending = useCommitmentRequests(organizationId, budgetId, "spending");
  const funding = useCommitmentRequests(organizationId, budgetId, "funding");
  const plans = useBudgetPlans(organizationId, true);
  const data = overview.data;
  if (!data || overview.error)
    return (
      <QueryState
        loading={overview.isLoading}
        error={overview.error}
        retry={() => void overview.refetch()}
      />
    );
  const currency = data.budget.currency ?? "";
  const annual = sumFinancialAmounts([
    data.totals.allocation,
    data.remaining_reserve ?? "0",
  ]);
  const total = finance ? annual : data.totals.allocation;
  const position = [
    { label: "Committed", amount: data.totals.committed, color: "bg-primary" },
    {
      label: finance ? "Available to departments" : "Available",
      amount: data.totals.available,
      color: "bg-info",
    },
    ...(finance
      ? [
          {
            label: "Organization reserve",
            amount: data.remaining_reserve ?? "0",
            color: "bg-border",
          },
        ]
      : []),
  ];
  const requests = [
    ...(spending.data?.requests ?? []),
    ...(funding.data?.requests ?? []),
  ];
  const queue = requests.filter(
    (item) => item.status === "pending" && item.actions.approve,
  );
  const recent = [...requests]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);
  const href = (request: CommitmentRequest) =>
    `/organizations/${organizationId}/spending?year=${data.budget.fiscal_year}&kind=${request.kind}&request=${request.id}`;
  const money = (amount: string) =>
    `${formatFinancialAmount(amount)} ${currency}`;
  const pendingPlans =
    plans.data?.plans.filter(
      (item) => !["approved", "rejected", "cancelled"].includes(item.status),
    ) ?? [];
  return (
    <>
      <dl
        className={`financial-statement ${finance ? "" : "xl:grid-cols-3"}`}
        aria-label="Budget balances"
      >
        {[
          {
            label: finance ? "Approved annual budget" : "Department allocation",
            amount: total ?? data.totals.allocation,
          },
          { label: "Committed spending", amount: data.totals.committed },
          {
            label: finance ? "Available to departments" : "Available",
            amount: data.totals.available,
          },
          ...(finance
            ? [
                {
                  label: "Organization reserve",
                  amount: data.remaining_reserve ?? "0",
                },
              ]
            : []),
        ].map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>
              <span data-slot="financial-amount" className="whitespace-nowrap">
                {formatFinancialAmount(item.amount)}
              </span>{" "}
              <span className="text-xs font-medium text-muted-foreground">
                {currency}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <section className="workspace-panel p-5" aria-label="Budget position">
        <div className="mb-4 flex flex-wrap justify-between gap-2">
          <h2 className="font-semibold">Budget position</h2>
          <p className="text-xs text-muted-foreground">
            Commitments authorize spending; payments are not tracked.
          </p>
        </div>
        <div
          className="flex h-3 overflow-hidden rounded-sm bg-muted"
          aria-hidden="true"
        >
          {position.map((item) => (
            <div
              key={item.label}
              className={item.color}
              style={{
                width: `${total ? (financialPercentage(item.amount, total) ?? 0) : 0}%`,
              }}
            />
          ))}
        </div>
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          {position.map((item) => (
            <div
              key={item.label}
              className="flex flex-wrap items-center gap-2 text-xs"
            >
              <span
                className={`size-2 shrink-0 rounded-sm ${item.color}`}
                aria-hidden="true"
              />
              <dt className="text-muted-foreground">
                {!finance && item.label === "Available to departments"
                  ? "Available"
                  : item.label}
              </dt>
              <dd className="font-medium tabular-nums">{money(item.amount)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,1fr)]">
        <DepartmentBalances
          data={data}
          organizationId={organizationId}
          finance={finance}
        />
        <section
          className="workspace-panel order-1 xl:order-2"
          aria-labelledby="decisions-heading"
        >
          <div className="panel-heading">
            <h2 id="decisions-heading">Needs your review</h2>
            <Badge variant={queue.length ? "warning" : "default"}>
              {queue.length} {queue.length === 1 ? "request" : "requests"}
            </Badge>
          </div>
          <div className="px-5">
            <QueryState
              loading={spending.isLoading || funding.isLoading}
              error={spending.error ?? funding.error}
              retry={() => {
                void spending.refetch();
                void funding.refetch();
              }}
            >
              {queue.length ? (
                <ul className="divide-y">
                  {queue.map((item) => (
                    <li key={`${item.kind}-${item.id}`}>
                      <Link
                        className="flex min-h-20 items-center justify-between gap-3 py-4 hover:text-primary"
                        href={href(item)}
                      >
                        <div className="min-w-0">
                          <p className="break-words font-medium">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.kind === "funding"
                              ? "Extra budget"
                              : "Spending request"}{" "}
                            · {item.author_name}
                          </p>
                          <p className="mt-2 font-medium tabular-nums">
                            {money(item.amount)}
                          </p>
                        </div>
                        <ArrowRight className="size-4 shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-start gap-3 py-6 text-muted-foreground">
                  <CheckCheck className="mt-0.5 size-5 shrink-0 text-success" />
                  <p className="text-sm">
                    No spending or funding requests await your approval.
                  </p>
                </div>
              )}
            </QueryState>
          </div>
          <div className="border-t p-5">
            <h3 className="mb-2 text-sm font-medium">Annual planning</h3>
            <QueryState
              loading={plans.isLoading}
              error={plans.error}
              retry={() => void plans.refetch()}
            >
              <p className="text-xs leading-relaxed text-muted-foreground">
                {pendingPlans.length
                  ? `${pendingPlans.length} proposal${pendingPlans.length === 1 ? " is" : "s are"} in progress. Review stages determine the next approver.`
                  : "No annual proposals are in progress."}
              </p>
              <Link
                className="mt-2 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:underline"
                href={`/organizations/${organizationId}/budgets`}
              >
                Open budget planning
                <ArrowRight className="size-4" />
              </Link>
            </QueryState>
          </div>
        </section>
      </div>
      <section className="workspace-panel" aria-labelledby="recent-heading">
        <div className="panel-heading">
          <h2 id="recent-heading">Recent requests & allocations</h2>
          <span className="text-xs text-muted-foreground">
            By creation date
          </span>
        </div>
        <div className="px-5">
          <QueryState
            loading={spending.isLoading || funding.isLoading}
            error={spending.error ?? funding.error}
            retry={() => {
              void spending.refetch();
              void funding.refetch();
            }}
            empty={
              !recent.length
                ? "Requests and manager allocations will appear here when created."
                : undefined
            }
          >
            <ul className="divide-y">
              {recent.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={href(item)}
                    className="flex flex-wrap items-center gap-3 py-4 hover:text-primary"
                  >
                    <div className="min-w-0 flex-1 basis-52">
                      <p className="break-words font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.allocated_to_user_id !== null
                          ? `Manager allocation · ${item.allocated_to_name}`
                          : item.kind === "funding"
                            ? "Extra budget request"
                            : `Requested by ${item.author_name}`}{" "}
                        ·{" "}
                        {new Date(item.created_at).toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="font-medium tabular-nums">
                      {money(item.amount)}
                    </span>
                    <Badge
                      variant={
                        item.status === "approved"
                          ? "success"
                          : item.status === "pending"
                            ? "warning"
                            : "default"
                      }
                    >
                      {item.status}
                    </Badge>
                    <ArrowRight className="size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </QueryState>
        </div>
      </section>
    </>
  );
}
