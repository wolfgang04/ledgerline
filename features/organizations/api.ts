import { api } from "@/lib/api";
import type {
  Invitation,
  Department,
  Organization,
  OrganizationMember,
} from "./types";
import type { Role } from "@/features/auth/types";

type InvitePayload = { email: string; role: Role };
type UpdatedMember = { user_id: number; role: Role };

export async function listMyOrganizations(signal?: AbortSignal) {
  return (
    await api.get<{ organizations: Organization[] }>("/organizations", {
      signal,
    })
  ).data;
}

export async function listOrganizationMembers(
  organizationId: number,
  signal?: AbortSignal,
) {
  return (
    await api.get<{ members: OrganizationMember[] }>(
      `/organizations/${organizationId}/members`,
      { signal },
    )
  ).data;
}

export async function listOrganizationStructure(
  organizationId: number,
  signal?: AbortSignal,
) {
  return (
    await api.get<{ departments: Department[] }>(
      `/organizations/${organizationId}/structure`,
      { signal },
    )
  ).data;
}

export async function createDepartment(organizationId: number, name: string) {
  return (
    await api.post<{ department: Department }>(
      `/organizations/${organizationId}/departments`,
      { name },
    )
  ).data;
}

export async function createTeam(
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

export async function deleteDepartment(
  organizationId: number,
  departmentId: number,
) {
  return api.delete(
    `/organizations/${organizationId}/departments/${departmentId}`,
  );
}

export async function setMemberDepartment(
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

export async function addTeamMember(
  organizationId: number,
  teamId: number,
  userId: number,
) {
  return api.post(`/organizations/${organizationId}/teams/${teamId}/members`, {
    user_id: userId,
  });
}

export async function removeTeamMember(
  organizationId: number,
  teamId: number,
  userId: number,
) {
  return api.delete(
    `/organizations/${organizationId}/teams/${teamId}/members/${userId}`,
  );
}

export async function createOrganization(name: string) {
  return (
    await api.post<{ organization: Organization }>("/organizations", { name })
  ).data;
}

export async function inviteUser(
  organizationId: number,
  payload: InvitePayload,
) {
  return (
    await api.post<{ invitation: Invitation }>(
      `/organizations/${organizationId}/invitations`,
      payload,
    )
  ).data;
}

export async function updateMemberRole(
  organizationId: number,
  userId: number,
  role: Role,
) {
  return (
    await api.patch<{ member: UpdatedMember }>(
      `/organizations/${organizationId}/members/${userId}/role`,
      { role },
    )
  ).data;
}

export async function listMyInvitations(signal?: AbortSignal) {
  return (
    await api.get<{ invitations: Invitation[] }>("/organizations/invitations", {
      signal,
    })
  ).data;
}

export async function acceptInvitation(invitationId: number) {
  return (
    await api.post<{ msg: string }>("/organizations/invitations/accept", {
      invitation_id: invitationId,
    })
  ).data;
}
