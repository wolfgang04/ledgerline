import { api } from "@/lib/api";
import type {
  FinancialSettings,
  BudgetDepartment,
  BudgetPlan,
  ProposalDetail,
  BudgetAction,
} from "./types";
export async function getBudgetDepartments(id: number, signal?: AbortSignal) {
  return (
    await api.get<{ departments: BudgetDepartment[] }>(
      `/organizations/${id}/budget-departments`,
      { signal },
    )
  ).data;
}
export async function getFinancialSettings(id: number, signal?: AbortSignal) {
  return (
    await api.get<{ settings: FinancialSettings; currencies: string[] }>(
      `/organizations/${id}/financial-settings`,
      { signal },
    )
  ).data;
}
export async function getBudgetPlans(id: number, signal?: AbortSignal) {
  return (
    await api.get<{ plans: BudgetPlan[] }>(
      `/organizations/${id}/budget-plans`,
      { signal },
    )
  ).data;
}
export async function getBudgetPlanDetail(
  id: number,
  planId: number,
  signal?: AbortSignal,
) {
  return (
    await api.get<ProposalDetail>(
      `/organizations/${id}/budget-plans/${planId}`,
      { signal },
    )
  ).data;
}
export async function executeBudgetAction(id: number, action: BudgetAction) {
  const base = `/organizations/${id}`;
  if (action.kind === "save-spending-plan") {
    await api.put(
      `${base}/budget-plans/${action.planId}/departments/${action.departmentId}/spending-plan`,
      action.values,
    );
    return;
  }
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
  if (action.kind === "approve" || action.kind === "commit")
    return (
      await api.post<{ plan: BudgetPlan }>(
        `${base}/budget-plans/${action.planId}/${action.kind}`,
        { updated_at: action.updated_at },
      )
    ).data.plan;
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
}
