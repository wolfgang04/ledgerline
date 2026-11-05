"use client";
import { useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { Metrics } from "@/components/metrics";
import { QueryState } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeaveConfirmation } from "@/components/unsaved-changes";
import type { Notify } from "@/components/notice";
import type { Role } from "@/features/auth/types";
import { formatFinancialAmount } from "@/lib/budget";
import {
  useCommitmentBudgets,
  useCommitmentOverview,
  useCommitmentRequests,
} from "./queries";
import { RequestForm } from "./request-form";
import { RequestDetailPanel } from "./request-detail";
import type { RequestKind, CommitmentDepartment } from "./types";
import { useBudgetLocation } from "../use-budget-location";

export function SpendingDashboard({
  organizationId,
  role,
  onNotice,
}: {
  organizationId: number;
  role: Role;
  onNotice: Notify;
}) {
  const budgets = useCommitmentBudgets(organizationId);
  const location = useBudgetLocation();
  const leave = useLeaveConfirmation();
  const selected =
    budgets.data?.budgets.find(
      (budget) => String(budget.fiscal_year) === location.params.get("year"),
    ) ??
    budgets.data?.budgets.find((budget) => budget.status === "active") ??
    budgets.data?.budgets[0];
  return (
    <div className="space-y-6">
      <PageHeading
        title={
          role === "employee" ? "Spending requests" : "Spending & commitments"
        }
        description={
          role === "employee"
            ? "View your department’s approved plan and available funds, then request spending."
            : "Compare approved allocations with authorized spending. Pending requests do not consume available funds."
        }
      />
      <QueryState
        loading={budgets.isLoading}
        error={budgets.error}
        retry={() => void budgets.refetch()}
        empty={
          budgets.data && !selected
            ? "No department budget is available yet. Finance must activate an annual allocation before spending can be requested."
            : undefined
        }
      >
        {selected && (
          <>
            <div className="max-w-sm space-y-2">
              <Label htmlFor="commitment-year">Budget year</Label>
              <Select
                value={String(selected.id)}
                items={Object.fromEntries(
                  (budgets.data?.budgets ?? []).map((budget) => [
                    String(budget.id),
                    `FY ${budget.fiscal_year} · ${budget.status}`,
                  ]),
                )}
                onValueChange={(value) =>
                  value !== null &&
                  leave.request(() =>
                    location.update({
                      year:
                        budgets.data?.budgets.find(
                          (budget) => budget.id === Number(value),
                        )?.fiscal_year ?? null,
                      request: null,
                    }),
                  )
                }
              >
                <SelectTrigger id="commitment-year" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {budgets.data?.budgets.map((budget) => (
                    <SelectItem key={budget.id} value={String(budget.id)}>
                      FY {budget.fiscal_year} · {budget.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <BudgetSpending
              key={selected.id}
              organizationId={organizationId}
              budgetId={selected.id}
              role={role}
              onNotice={onNotice}
            />
          </>
        )}
      </QueryState>
    </div>
  );
}

function CategoryComparison({
  department,
  currency,
}: {
  department: CommitmentDepartment;
  currency: string;
}) {
  return (
    <Table aria-label={`${department.name} category comparison`}>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Annual plan ({currency})</TableHead>
          <TableHead className="text-right">Committed ({currency})</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {department.categories.map((line, index) => (
          <TableRow key={index}>
            <TableCell className="max-w-64 whitespace-normal break-words">
              {line.category ?? "Unplanned"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatFinancialAmount(line.planned)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatFinancialAmount(line.committed)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function BudgetSpending({
  organizationId,
  budgetId,
  role,
  onNotice,
}: {
  organizationId: number;
  budgetId: number;
  role: Role;
  onNotice: Notify;
}) {
  const overview = useCommitmentOverview(organizationId, budgetId);
  const spending = useCommitmentRequests(organizationId, budgetId, "spending");
  const funding = useCommitmentRequests(
    organizationId,
    budgetId,
    "funding",
    role !== "employee",
  );
  const location = useBudgetLocation();
  const leave = useLeaveConfirmation();
  const kind: RequestKind =
    role !== "employee" && location.params.get("kind") === "funding"
      ? "funding"
      : "spending";
  const [filter, setFilter] = useState(role === "finance" ? "queue" : "all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [form, setForm] = useState<RequestKind | "allocation" | null>(null);
  const requestId = Number(location.params.get("request"));
  const detail =
    Number.isSafeInteger(requestId) && requestId > 0
      ? { kind, id: requestId }
      : null;
  const data = overview.data;
  const currency = data?.budget.currency ?? "";
  const active = data?.budget.status === "active";
  const requests = kind === "spending" ? spending : funding;
  const filtered =
    requests.data?.requests.filter(
      (request) =>
        (departmentFilter === "all" ||
          String(request.department_id) === departmentFilter) &&
        (filter === "all" ||
          (filter === "queue"
            ? request.status === "pending" && request.actions.approve
            : request.status === filter)),
    ) ?? [];
  const money = (amount: string) =>
    `${formatFinancialAmount(amount)} ${currency}`;
  return (
    <QueryState
      loading={overview.isLoading}
      error={overview.error}
      retry={() => void overview.refetch()}
    >
      {data && (
        <div className="space-y-6">
          {form ? (
            <RequestForm
              organizationId={organizationId}
              budgetId={budgetId}
              kind={form === "allocation" ? "spending" : form}
              categories={data.categories}
              currency={currency}
              manager={role === "manager"}
              {...(form === "allocation"
                ? { allocation: data.departments[0] }
                : {})}
              onNotice={onNotice}
              onClose={() => setForm(null)}
            />
          ) : detail ? (
            <RequestDetailPanel
              key={`${detail.kind}-${detail.id}`}
              organizationId={organizationId}
              budgetId={budgetId}
              kind={detail.kind}
              requestId={detail.id}
              currency={currency}
              active={active}
              onNotice={onNotice}
              onClose={() =>
                leave.request(() => location.update({ request: null }))
              }
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="break-words text-xl font-semibold">
                    {role === "finance"
                      ? "Department commitments"
                      : data.departments[0]?.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {active
                      ? "Active annual budget"
                      : "Historical budget · new requests and approvals are unavailable"}
                  </p>
                </div>
                {active && role !== "finance" && (
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setForm("spending")}>
                      Request spending
                    </Button>
                    {role === "manager" && (
                      <Button onClick={() => setForm("allocation")}>
                        Allocate spending to member
                      </Button>
                    )}
                    {role === "manager" && (
                      <Button
                        variant="outline"
                        onClick={() => setForm("funding")}
                      >
                        Request extra budget
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {data.totals && (
                <Metrics
                  items={[
                    {
                      label: "Allocated",
                      value: money(data.totals.allocation),
                    },
                    { label: "Committed", value: money(data.totals.committed) },
                    { label: "Available", value: money(data.totals.available) },
                    ...(data.remaining_reserve !== undefined
                      ? [
                          {
                            label: "Organization reserve",
                            value: money(data.remaining_reserve),
                          },
                        ]
                      : []),
                  ]}
                />
              )}
              {role === "finance" && (
                <Table aria-label="Department budget comparison">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">
                        Original ({currency})
                      </TableHead>
                      <TableHead className="text-right">
                        Added funding
                      </TableHead>
                      <TableHead className="text-right">Allocated</TableHead>
                      <TableHead className="text-right">Committed</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.departments?.map((department) => (
                      <TableRow key={department.department_id}>
                        <TableCell className="max-w-64 whitespace-normal break-words">
                          {department.name}
                        </TableCell>
                        {(
                          [
                            "original_allocation",
                            "added_funding",
                            "allocation",
                            "committed",
                            "available",
                          ] as const
                        ).map((field) => (
                          <TableCell
                            key={field}
                            className="text-right tabular-nums"
                          >
                            {formatFinancialAmount(department[field])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!!data.departments.length && (
                <section
                  className="space-y-4 border-t pt-5"
                  aria-labelledby="category-heading"
                >
                  <h2 id="category-heading" className="text-lg font-semibold">
                    Annual plan vs committed spending
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Categories guide comparison. Approval is limited by the
                    department’s total available funds.
                  </p>
                  {data.departments.map((department) =>
                    role === "finance" ? (
                      <details
                        key={department.department_id}
                        className="border-b py-3"
                      >
                        <summary className="cursor-pointer break-words font-medium">
                          {department.name}
                        </summary>
                        <div className="pt-4">
                          <CategoryComparison
                            department={department}
                            currency={currency}
                          />
                        </div>
                      </details>
                    ) : (
                      <CategoryComparison
                        key={department.department_id}
                        department={department}
                        currency={currency}
                      />
                    ),
                  )}
                </section>
              )}
              <section className="space-y-4" aria-labelledby="requests-heading">
                <h2 id="requests-heading" className="text-lg font-semibold">
                  {role === "employee"
                    ? "My requests and allocations"
                    : "Requests and allocations"}
                </h2>
                {role !== "employee" && (
                  <Tabs
                    value={kind}
                    onValueChange={(value) =>
                      location.update({
                        kind: value === "funding" ? "funding" : "spending",
                        request: null,
                      })
                    }
                  >
                    <TabsList className="group-data-horizontal/tabs:h-auto w-full flex-col items-stretch sm:w-fit sm:flex-row">
                      <TabsTrigger className="min-h-11 px-3" value="spending">
                        Spending requests
                      </TabsTrigger>
                      <TabsTrigger className="min-h-11 px-3" value="funding">
                        Extra budget requests
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
                <div className="flex flex-wrap gap-4">
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="request-status">Show requests</Label>
                    <Select
                      value={filter}
                      items={{
                        all: "All requests",
                        queue: "Awaiting my approval",
                        pending: "All pending",
                        approved: "Approved",
                        rejected: "Rejected",
                        withdrawn: "Withdrawn",
                        cancelled: "Cancelled",
                      }}
                      onValueChange={(value) =>
                        value !== null && setFilter(value)
                      }
                    >
                      <SelectTrigger id="request-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All requests</SelectItem>
                        {role !== "employee" && (
                          <SelectItem value="queue">
                            Awaiting my approval
                          </SelectItem>
                        )}
                        <SelectItem value="pending">All pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        {kind === "spending" && (
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {role === "finance" && (
                    <div className="min-w-0 space-y-2">
                      <Label htmlFor="request-department">Department</Label>
                      <Select
                        value={departmentFilter}
                        items={{
                          all: "All departments",
                          ...Object.fromEntries(
                            (data.departments ?? []).map((department) => [
                              String(department.department_id),
                              department.name,
                            ]),
                          ),
                        }}
                        onValueChange={(value) =>
                          value !== null && setDepartmentFilter(value)
                        }
                      >
                        <SelectTrigger
                          id="request-department"
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All departments</SelectItem>
                          {data.departments?.map((department) => (
                            <SelectItem
                              key={department.department_id}
                              value={String(department.department_id)}
                            >
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <QueryState
                  loading={requests.isLoading}
                  error={requests.error}
                  retry={() => void requests.refetch()}
                  empty={
                    !filtered.length && requests.data
                      ? "No requests match this view."
                      : undefined
                  }
                >
                  <ul className="divide-y rounded-lg border bg-card px-4 sm:px-5">
                    {filtered.map((request) => (
                      <li
                        key={request.id}
                        className="flex flex-wrap items-center justify-between gap-4 py-4"
                      >
                        <div className="min-w-0 flex-1 basis-48 space-y-2">
                          <h3 className="break-words font-medium">
                            {request.title}
                          </h3>
                          {request.allocated_to_user_id !== null && (
                            <p className="break-words text-sm">
                              <span className="font-medium">
                                Manager allocation
                              </span>{" "}
                              · For {request.allocated_to_name}
                            </p>
                          )}
                          <p className="break-words text-sm text-muted-foreground">
                            {request.allocated_to_user_id !== null
                              ? `Allocated by ${request.author_name}`
                              : request.author_name}
                            {role === "finance"
                              ? ` · ${data.departments?.find((department) => department.department_id === request.department_id)?.name ?? "Department"}`
                              : ""}
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-medium tabular-nums">
                              {money(request.amount)}
                            </span>
                            <Badge
                              variant={
                                request.status === "approved"
                                  ? "success"
                                  : request.status === "pending"
                                    ? "warning"
                                    : request.status === "rejected"
                                      ? "destructive"
                                      : "default"
                              }
                            >
                              {request.status}
                            </Badge>
                          </div>
                          {request.status === "pending" && (
                            <p className="text-xs text-muted-foreground">
                              Awaiting{" "}
                              {request.approval_role === "finance"
                                ? "Finance"
                                : "department manager"}{" "}
                              approval
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          aria-label={`View ${kind} request ${request.id}`}
                          onClick={() =>
                            location.update({ kind, request: request.id })
                          }
                        >
                          View request
                        </Button>
                      </li>
                    ))}
                  </ul>
                </QueryState>
              </section>
            </>
          )}
        </div>
      )}
    </QueryState>
  );
}
