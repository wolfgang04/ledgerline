import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBudgetDepartments,
  getFinancialSettings,
  getBudgetPlans,
  getBudgetPlanDetail,
  executeBudgetAction,
} from "./api";
import type { BudgetAction, ProposalDetail } from "./types";
const budgetKey = (id: number) => ["organizations", id, "budgets"];
export function useBudgetDepartments(id: number) {
  return useQuery({
    queryKey: [...budgetKey(id), "departments"],
    queryFn: ({ signal }) => getBudgetDepartments(id, signal),
  });
}
export function useFinancialSettings(id: number, enabled: boolean) {
  return useQuery({
    queryKey: [...budgetKey(id), "settings"],
    queryFn: ({ signal }) => getFinancialSettings(id, signal),
    enabled,
  });
}
export function useBudgetPlans(id: number, enabled: boolean) {
  return useQuery({
    queryKey: [...budgetKey(id), "plans"],
    queryFn: ({ signal }) => getBudgetPlans(id, signal),
    enabled,
  });
}
export function useBudgetPlan(id: number, planId: number) {
  return useQuery({
    queryKey: [...budgetKey(id), "plan", planId],
    refetchOnWindowFocus: false,
    queryFn: ({ signal }) => getBudgetPlanDetail(id, planId, signal),
  });
}
export function useBudgetConversation(
  id: number,
  planId: number,
  initialData: ProposalDetail | undefined,
) {
  return useQuery({
    queryKey: [...budgetKey(id), "conversation", planId],
    queryFn: ({ signal }) => getBudgetPlanDetail(id, planId, signal),
    initialData,
    enabled: !!initialData,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
export function useBudgetMutation(id: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: BudgetAction) => executeBudgetAction(id, action),
    onSuccess: (_data, action) =>
      client.invalidateQueries({
        queryKey:
          action.kind === "message"
            ? [...budgetKey(id), "conversation", action.planId]
            : budgetKey(id),
      }),
  });
}
