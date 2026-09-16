import { useMutation } from "@tanstack/react-query";
import { api, type Invitation, type Organization, type Role } from "../../lib/api";

type InvitePayload = {
  email: string;
  role: Role;
};

type UpdatedMember = {
  user_id: number;
  role: Role;
};

async function createOrganization(name: string) {
  return (await api.post<{ organization: Organization }>("/organizations", { name })).data;
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
  return useMutation({ mutationFn: createOrganization });
}

export function useInviteUserMutation() {
  return useMutation({
    mutationFn: ({ id, email, role }: { id: string; email: string; role: Role }) =>
      inviteUser(id, { email, role }),
  });
}

export function useUpdateRoleMutation() {
  return useMutation({
    mutationFn: ({ orgId, userId, role }: { orgId: string; userId: string; role: Role }) =>
      updateMemberRole(orgId, userId, role),
  });
}