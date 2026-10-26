import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type FinancialSettings = {
  fiscal_year_start_month: number | null;
  currency: string | null;
  locked: boolean;
};
export type ProposalInput = {
  name: string;
  description: string;
  fiscal_year: number;
  proposed_amount: string;
  allocations: { department_id: number; proposed_amount: string }[];
};
export type BudgetPlan = Omit<
  ProposalInput,
  "proposed_amount" | "description" | "allocations"
> & {
  id: number;
  organization_id: number;
  proposed_amount: string | null;
  description: string | null;
  status:
    | "draft"
    | "under_review"
    | "changes_requested"
    | "revising"
    | "approved"
    | "rejected"
    | "cancelled";
  revision_number: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};

export type Allocation = {
  department_id: number;
  name: string;
  proposed_amount: string;
};
export type ProposalSnapshot = {
  name: string;
  description: string | null;
  fiscal_year: number;
  proposed_amount: string | null;
  currency: string | null;
  fiscal_year_start_month: number | null;
  allocations: Allocation[];
  reserve: string | null;
  baseline?: boolean;
};
export type ReviewMessage = {
  id: number;
  created_by: number;
  author_name: string | null;
  created_at: string;
  revision_number: number;
  department_id: number | null;
  kind: "comment" | "request_changes" | "agreement";
  description_comments: string | null;
  request_id: number | null;
  agreed?: boolean;
  agreement_snapshot: ProposalSnapshot | null;
};
export type ProposalDetail = {
  audit: ProposalAuditEvent[];
  plan: BudgetPlan;
  working: ProposalSnapshot;
  department_id: number | null;
  revisions: {
    id: number;
    revision_number: number;
    snapshot: ProposalSnapshot;
    summary: string;
    author_name: string;
    created_at: string;
  }[];
  messages: ReviewMessage[];
};

export type ProposalAuditEvent = {
  id: number;
  action: string;
  reason: string | null;
  revision_number: number;
  created_by: number | null;
  author_name: string;
  created_at: string;
  changes: {
    field: string;
    department_id: number | null;
    department_name: string | null;
    before: string | number | null;
    after: string | number | null;
  }[];
};

const budgetKey = (id: number) => ["organizations", id, "budgets"];
export function useFinancialSettings(id: number, enabled: boolean) {
  return useQuery({
    queryKey: [...budgetKey(id), "settings"],
    queryFn: async ({ signal }) =>
      (
        await api.get<{ settings: FinancialSettings; currencies: string[] }>(
          `/organizations/${id}/financial-settings`,
          { signal },
        )
      ).data,
    enabled,
  });
}
export function useBudgetPlans(id: number, enabled: boolean) {
  return useQuery({
    queryKey: [...budgetKey(id), "plans"],
    queryFn: async ({ signal }) =>
      (
        await api.get<{ plans: BudgetPlan[] }>(
          `/organizations/${id}/budget-plans`,
          { signal },
        )
      ).data,
    enabled,
  });
}

export function useBudgetPlan(id: number, planId: number) {
  return useQuery({
    queryKey: [...budgetKey(id), "plan", planId],
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) =>
      (
        await api.get<ProposalDetail>(
          `/organizations/${id}/budget-plans/${planId}`,
          { signal },
        )
      ).data,
  });
}

export function useBudgetConversation(
  id: number,
  planId: number,
  initialData: ProposalDetail | undefined,
) {
  return useQuery({
    queryKey: [...budgetKey(id), "conversation", planId],
    queryFn: async ({ signal }) =>
      (
        await api.get<ProposalDetail>(
          `/organizations/${id}/budget-plans/${planId}`,
          { signal },
        )
      ).data,
    initialData,
    enabled: !!initialData,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

type BudgetAction =
  | {
      kind: "settings";
      settings: Pick<FinancialSettings, "currency" | "fiscal_year_start_month">;
    }
  | { kind: "create"; values: ProposalInput }
  | {
      kind: "update";
      planId: number;
      updated_at: string;
      values: ProposalInput;
      reason: string;
    }
  | {
      kind: "start-revision";
      planId: number;
      updated_at: string;
      reason: string;
    }
  | { kind: "submit"; planId: number; updated_at: string; summary: string }
  | {
      kind: "message";
      planId: number;
      values: {
        revision_number: number;
        department_id: number | null;
        kind: ReviewMessage["kind"];
        message: string;
        request_id?: number;
        updated_at?: string;
      };
    };

export function useBudgetMutation(id: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (action: BudgetAction) => {
      const base = `/organizations/${id}`;
      if (action.kind === "settings") {
        await api.patch(`${base}/financial-settings`, action.settings);
        return;
      }
      if (action.kind === "message") {
        await api.post(
          `${base}/budget-plans/${action.planId}/messages`,
          action.values,
        );
        return;
      }
      if (action.kind === "start-revision")
        return (
          await api.post<{ plan: BudgetPlan }>(
            `${base}/budget-plans/${action.planId}/start-revision`,
            { updated_at: action.updated_at, reason: action.reason },
          )
        ).data.plan;
      if (action.kind === "create")
        return (
          await api.post<{ plan: BudgetPlan }>(
            `${base}/budget-plans`,
            action.values,
          )
        ).data.plan;
      if (action.kind === "update")
        return (
          await api.patch<{ plan: BudgetPlan }>(
            `${base}/budget-plans/${action.planId}`,
            {
              ...action.values,
              updated_at: action.updated_at,
              reason: action.reason,
            },
          )
        ).data.plan;
      return (
        await api.post<{ plan: BudgetPlan }>(
          `${base}/budget-plans/${action.planId}/submit`,
          { updated_at: action.updated_at, summary: action.summary },
        )
      ).data.plan;
    },
    onSuccess: (_data, action) =>
      client.invalidateQueries({
        queryKey:
          action.kind === "message"
            ? [...budgetKey(id), "conversation", action.planId]
            : budgetKey(id),
      }),
  });
}
