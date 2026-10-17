import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role } from "@/features/auth/types";
import { organizationKeys } from "./query-keys";
import { inviteUser, listMyInvitations, acceptInvitation } from "./api";

export function useInviteUserMutation() {
  return useMutation({
    mutationFn: ({
      id,
      email,
      role,
    }: {
      id: number;
      email: string;
      role: Role;
    }) => inviteUser(id, { email, role }),
  });
}

export function useMyInvitationsQuery(enabled = true) {
  return useQuery({
    queryKey: organizationKeys.invitations,
    queryFn: ({ signal }) => listMyInvitations(signal),
    enabled,
  });
}

export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}
