"use client";

import { FormEvent, useState } from "react";
import {
  useInviteUserMutation,
  useOrganizationMembersQuery,
  useOrganizationsQuery,
  useUpdateRoleMutation,
} from "../../../hooks/queries/organization";
import {
  getApiError,
  type Organization,
  type Role,
  type User,
} from "../../../lib/api";
import { InviteMemberForm } from "./invite-member-form";
import { MemberDirectory } from "./member-directory";
import { OrganizationAccessNotice } from "./organization-access-notice";
import { OrganizationMetrics } from "./organization-metrics";
import { OrganizationPageHeader } from "./organization-page-header";
import { OrganizationSidebar } from "./organization-sidebar";
import { OrganizationStructurePanel } from "./organization-structure/organization-structure-panel";
import { OrganizationToolbar } from "./organization-toolbar";
import { OrganizationWorkspaceTabs } from "./organization-workspace-tabs";

type OrganizationDashboardProps = {
  user: User;
  organizationId: number;
  onSignOut: () => void;
  onNotice: (notice: { type: "success" | "error"; text: string }) => void;
};

export function OrganizationDashboard({
  user,
  organizationId,
  onSignOut,
  onNotice,
}: OrganizationDashboardProps) {
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const organizationsQuery = useOrganizationsQuery(true);
  const organizations = organizationsQuery.data?.organizations ?? [];
  const organization = organizations.find(({ id }) => id === organizationId) as
    Organization | undefined;
  const membersQuery = useOrganizationMembersQuery(organizationId);
  const members = membersQuery.data?.members ?? [];
  const inviteUser = useInviteUserMutation();
  const updateRoleMutation = useUpdateRoleMutation();
  const [roleDrafts, setRoleDrafts] = useState<Record<number, Role>>({});
  const canManageAccess = organization?.role === "organization_admin";
  const visibleMembers = members.filter((member) =>
    `${member.first_name} ${member.last_name} ${member.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const failure = (error: unknown) =>
    onNotice({ type: "error", text: getApiError(error) });

  function inviteFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    inviteUser.mutate(
      {
        id: String(organizationId),
        email: String(data.get("email")),
        role: data.get("role") as Role,
      },
      {
        onSuccess: () => {
          setShowInvite(false);
          onNotice({
            type: "success",
            text: "Invitation created and ready for acceptance.",
          });
        },
        onError: failure,
      },
    );
  }

  function updateRole(memberId: number, role: Role) {
    setRoleDrafts((current) => ({ ...current, [memberId]: role }));
    updateRoleMutation.mutate(
      { orgId: String(organizationId), userId: String(memberId), role },
      {
        onSuccess: () =>
          onNotice({ type: "success", text: "Member access updated." }),
        onError: failure,
      },
    );
  }

  if (organizationsQuery.isLoading)
    return <div className="dashboard-loading">Loading organization...</div>;
  if (!organization)
    return <div className="dashboard-empty">Organization not found.</div>;

  return (
    <section className="dashboard-app org-admin-app">
      <OrganizationSidebar
        organizationName={organization.name}
        user={user}
        canManageAccess={canManageAccess}
        onSignOut={onSignOut}
      />
      <div className="dashboard-main">
        <OrganizationToolbar organizationName={organization.name} />
        <div className="org-admin-content">
          <OrganizationPageHeader
            organizationName={organization.name}
            canManageAccess={canManageAccess}
            onToggleInvite={() => setShowInvite((current) => !current)}
          />
          <OrganizationAccessNotice
            organizationName={organization.name}
            canManageAccess={canManageAccess}
          />
          <OrganizationMetrics members={members} />
          {showInvite && canManageAccess && (
            <InviteMemberForm
              isPending={inviteUser.isPending}
              onSubmit={inviteFromForm}
            />
          )}
          <OrganizationWorkspaceTabs
            memberCount={members.length}
            people={
              <MemberDirectory
                members={visibleMembers}
                isLoading={membersQuery.isLoading}
                canManageAccess={canManageAccess}
                search={search}
                onSearchChange={setSearch}
                onAddMember={() => setShowInvite(true)}
                roleDrafts={roleDrafts}
                onRoleChange={updateRole}
              />
            }
            structure={
              <OrganizationStructurePanel
                organizationId={organizationId}
                canManageAccess={canManageAccess}
                members={members}
                onNotice={onNotice}
              />
            }
          />
        </div>
        <footer className="dashboard-footer">
          <span>LEDGERLINE / 2026</span>
          <span>Secure financial operations</span>
        </footer>
      </div>
    </section>
  );
}
