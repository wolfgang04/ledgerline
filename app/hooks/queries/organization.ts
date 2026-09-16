import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type Invitation,
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
