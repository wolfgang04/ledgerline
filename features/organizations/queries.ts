import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role } from "@/features/auth/types";
import { organizationKeys } from "./query-keys";
import {
  listMyOrganizations,
  listOrganizationMembers,
  createOrganization,
  updateMemberRole,
} from "./api";

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
  });
}

export function useOrganizationsQuery(enabled = true) {
  return useQuery({
    queryKey: organizationKeys.all,
    queryFn: ({ signal }) => listMyOrganizations(signal),
    enabled,
  });
}

export function useOrganizationMembersQuery(organizationId: number | null) {
  return useQuery({
    queryKey: organizationId
      ? organizationKeys.members(organizationId)
      : ["organizations", "members", "none"],
    queryFn: ({ signal }) =>
      listOrganizationMembers(organizationId as number, signal),
    enabled:
      organizationId !== null &&
      Number.isSafeInteger(organizationId) &&
      organizationId > 0,
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orgId,
      userId,
      role,
    }: {
      orgId: number;
      userId: number;
      role: Role;
    }) => updateMemberRole(orgId, userId, role),
    onSuccess: (_, variables) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationKeys.members(variables.orgId),
        }),
        queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
      ]),
  });
}
