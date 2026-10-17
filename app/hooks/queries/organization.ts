import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type Invitation,
  type Department,
  type Organization,
  type OrganizationMember,
  type Role,
} from "../../lib/api";

type InvitePayload = {
  email: string;
  role: Role;
};

type UpdatedMember = {
  user_id: number;
  role: Role;
};

export const organizationKeys = {
  all: ["organizations"] as const,
  members: (organizationId: number) =>
    ["organizations", organizationId, "members"] as const,
  structure: (organizationId: number) =>
    ["organizations", organizationId, "structure"] as const,
  invitations: ["organizations", "invitations"] as const,
};

async function listMyOrganizations() {
  return (await api.get<{ organizations: Organization[] }>("/organizations"))
    .data;
}

async function listOrganizationMembers(organizationId: number) {
  return (
    await api.get<{ members: OrganizationMember[] }>(
      `/organizations/${organizationId}/members`,
    )
  ).data;
}

async function listOrganizationStructure(organizationId: number) {
  return (
    await api.get<{ departments: Department[] }>(
      `/organizations/${organizationId}/structure`,
    )
  ).data;
}

async function createDepartment(organizationId: number, name: string) {
  return (
    await api.post<{ department: Department }>(
      `/organizations/${organizationId}/departments`,
      { name },
    )
  ).data;
}

async function createTeam(
  organizationId: number,
  departmentId: number,
  name: string,
) {
  return (
    await api.post(
      `/organizations/${organizationId}/departments/${departmentId}/teams`,
      { name },
    )
  ).data;
}

async function deleteDepartment(organizationId: number, departmentId: number) {
  return api.delete(
    `/organizations/${organizationId}/departments/${departmentId}`,
  );
}

async function setMemberDepartment(
  organizationId: number,
  userId: number,
  departmentId: number | null,
) {
  return api.patch(
    `/organizations/${organizationId}/members/${userId}/department`,
    {
      department_id: departmentId,
    },
  );
}

async function addTeamMember(
  organizationId: number,
  teamId: number,
  userId: number,
) {
  return api.post(`/organizations/${organizationId}/teams/${teamId}/members`, {
    user_id: userId,
  });
}

async function removeTeamMember(
  organizationId: number,
  teamId: number,
  userId: number,
) {
  return api.delete(
    `/organizations/${organizationId}/teams/${teamId}/members/${userId}`,
  );
}

async function createOrganization(name: string) {
  return (
    await api.post<{ organization: Organization }>("/organizations", { name })
  ).data;
}

async function inviteUser(organizationId: string, payload: InvitePayload) {
  return (
    await api.post<{ invitation: Invitation }>(
      `/organizations/${organizationId}/invitations`,
      payload,
    )
  ).data;
}

async function updateMemberRole(
  organizationId: string,
  userId: string,
  role: Role,
) {
  return (
    await api.patch<{ member: UpdatedMember }>(
      `/organizations/${organizationId}/members/${userId}/role`,
      { role },
    )
  ).data;
}

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
    queryFn: listMyOrganizations,
    enabled,
  });
}

export function useOrganizationMembersQuery(organizationId: number | null) {
  return useQuery({
    queryKey: organizationId
      ? organizationKeys.members(organizationId)
      : ["organizations", "members", "none"],
    queryFn: () => listOrganizationMembers(organizationId as number),
    enabled: organizationId !== null,
  });
}

export function useOrganizationStructureQuery(organizationId: number | null) {
  return useQuery({
    queryKey: organizationId
      ? organizationKeys.structure(organizationId)
      : ["organizations", "structure", "none"],
    queryFn: () => listOrganizationStructure(organizationId as number),
    enabled: organizationId !== null,
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
      queryClient.invalidateQueries({
        queryKey: organizationKeys.structure(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(variables.organizationId),
      });
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

export function useInviteUserMutation() {
  return useMutation({
    mutationFn: ({
      id,
      email,
      role,
    }: {
      id: string;
      email: string;
      role: Role;
    }) => inviteUser(id, { email, role }),
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
      orgId: string;
      userId: string;
      role: Role;
    }) => updateMemberRole(orgId, userId, role),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(Number(variables.orgId)),
      }),
  });
}

async function listMyInvitations() {
  return (
    await api.get<{ invitations: Invitation[] }>("/organizations/invitations")
  ).data;
}

async function acceptInvitation(invitationId: number) {
  return (
    await api.post<{ msg: string }>("/organizations/invitations/accept", {
      invitation_id: invitationId,
    })
  ).data;
}

export function useMyInvitationsQuery(enabled = true) {
  return useQuery({
    queryKey: organizationKeys.invitations,
    queryFn: listMyInvitations,
    enabled,
  });
}

export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.invitations });
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}
