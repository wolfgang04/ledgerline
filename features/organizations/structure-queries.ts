import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationKeys } from "./query-keys";
import {
  listOrganizationStructure,
  createDepartment,
  createTeam,
  deleteDepartment,
  setMemberDepartment,
  addTeamMember,
  removeTeamMember,
} from "./api";

export function useOrganizationStructureQuery(organizationId: number | null) {
  return useQuery({
    queryKey: organizationId
      ? organizationKeys.structure(organizationId)
      : ["organizations", "structure", "none"],
    queryFn: ({ signal }) =>
      listOrganizationStructure(organizationId as number, signal),
    enabled:
      organizationId !== null &&
      Number.isSafeInteger(organizationId) &&
      organizationId > 0,
  });
}

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      name,
    }: {
      organizationId: number;
      name: string;
    }) => createDepartment(organizationId, name),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: organizationKeys.structure(variables.organizationId),
      }),
  });
}

export function useCreateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      departmentId,
      name,
    }: {
      organizationId: number;
      departmentId: number;
      name: string;
    }) => createTeam(organizationId, departmentId, name),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: organizationKeys.structure(variables.organizationId),
      }),
  });
}

export function useDeleteDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      departmentId,
    }: {
      organizationId: number;
      departmentId: number;
    }) => deleteDepartment(organizationId, departmentId),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: organizationKeys.structure(variables.organizationId),
      }),
  });
}

export function useSetMemberDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      userId,
      departmentId,
    }: {
      organizationId: number;
      userId: number;
      departmentId: number | null;
    }) => setMemberDepartment(organizationId, userId, departmentId),
    onSuccess: (_, variables) => {
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationKeys.structure(variables.organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: organizationKeys.members(variables.organizationId),
        }),
      ]);
    },
  });
}

export function useTeamMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      teamId,
      userId,
      remove,
    }: {
      organizationId: number;
      teamId: number;
      userId: number;
      remove?: boolean;
    }) =>
      remove
        ? removeTeamMember(organizationId, teamId, userId)
        : addTeamMember(organizationId, teamId, userId),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: organizationKeys.structure(variables.organizationId),
      }),
  });
}
