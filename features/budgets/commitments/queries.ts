import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CommitmentBudget,
  CommitmentOverview,
  CommitmentRequest,
  RequestKind,
  RequestInput,
  RequestAction,
  RequestDetail,
  AllocationInput,
} from "./types";

const key = (organizationId: number) => [
  "organizations",
  organizationId,
  "commitments",
];
const base = (organizationId: number) =>
  `/organizations/${organizationId}/commitment-budgets`;
export function useCommitmentBudgets(organizationId: number) {
  return useQuery({
    queryKey: key(organizationId),
    queryFn: async ({ signal }) =>
      (
        await api.get<{ budgets: CommitmentBudget[] }>(base(organizationId), {
          signal,
        })
      ).data,
  });
}
export function useCommitmentOverview(
  organizationId: number,
  budgetId: number,
) {
  return useQuery({
    queryKey: [...key(organizationId), budgetId, "overview"],
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    queryFn: async ({ signal }) =>
      (
        await api.get<CommitmentOverview>(
          `${base(organizationId)}/${budgetId}`,
          { signal },
        )
      ).data,
  });
}
export function useCommitmentRequests(
  organizationId: number,
  budgetId: number,
  kind: RequestKind,
  enabled = true,
) {
  return useQuery({
    queryKey: [...key(organizationId), budgetId, kind],
    enabled,
    queryFn: async ({ signal }) =>
      (
        await api.get<{ requests: CommitmentRequest[] }>(
          `${base(organizationId)}/${budgetId}/${kind}-requests`,
          { signal },
        )
      ).data,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}
export function useCommitmentDetail(
  organizationId: number,
  budgetId: number,
  kind: RequestKind,
  requestId: number,
) {
  return useQuery({
    queryKey: [...key(organizationId), budgetId, kind, requestId],
    queryFn: async ({ signal }) =>
      (
        await api.get<RequestDetail>(
          `${base(organizationId)}/${budgetId}/${kind}-requests/${requestId}`,
          { signal },
        )
      ).data,
  });
}
export function useCommitmentMutation(
  organizationId: number,
  budgetId: number,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (
      input:
        | { kind: "allocation"; values: AllocationInput }
        | { kind: RequestKind; values: RequestInput }
        | {
            kind: RequestKind;
            requestId: number;
            action: RequestAction;
            version: number;
            reason?: string;
          },
    ) => {
      const path = `${base(organizationId)}/${budgetId}/${input.kind === "allocation" ? "spending-allocations" : `${input.kind}-requests`}`;
      if ("values" in input) return (await api.post(path, input.values)).data;
      return (
        await api.post(`${path}/${input.requestId}/actions`, {
          action: input.action,
          version: input.version,
          reason: input.reason,
        })
      ).data;
    },
    onSettled: () =>
      client.invalidateQueries({ queryKey: key(organizationId) }),
  });
}
