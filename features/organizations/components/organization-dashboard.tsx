"use client";
import { useState, type FormEvent } from "react";
import { Building2, Users, UserPlus } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Metrics } from "@/components/metrics";
import { QueryState } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Notify } from "@/components/notice";
import { getApiError } from "@/lib/api";
import { useInviteUserMutation } from "@/features/organizations/invitation-queries";
import {
  useOrganizationMembersQuery,
  useOrganizationsQuery,
  useUpdateRoleMutation,
} from "@/features/organizations/queries";
import { useOrganizationStructureQuery } from "@/features/organizations/structure-queries";
import type { Role } from "@/features/auth/types";
import { InviteMemberForm } from "./invite-member-form";
import { MemberDirectory } from "./member-directory";
import { OrganizationStructurePanel } from "./organization-structure/organization-structure-panel";
export function OrganizationDashboard({
  organizationId,
  onNotice,
}: {
  organizationId: number;
  onNotice: Notify;
}) {
  const [showInvite, setShowInvite] = useState(false);
  const organizations = useOrganizationsQuery();
  const members = useOrganizationMembersQuery(organizationId);
  const structure = useOrganizationStructureQuery(organizationId);
  const invite = useInviteUserMutation();
  const updateRole = useUpdateRoleMutation();
  const organization = organizations.data?.organizations.find(
    ({ id }) => id === organizationId,
  );
  const canManage = organization?.role === "organization_admin";
  const onError = (error: unknown) =>
    onNotice({ type: "error", text: getApiError(error) });
  function submitInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    invite.mutate(
      {
        id: organizationId,
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
        onError,
      },
    );
  }
  return (
    <DashboardShell
      title={organization?.name ?? "Organization"}
      organizationId={organizationId}
    >
      <QueryState
        loading={organizations.isLoading}
        error={organizations.error}
        empty={
          !organization
            ? "Organization not found or access unavailable."
            : undefined
        }
      >
        <PageHeading
          title="People & teams"
          description={`Manage membership, roles, and departments for ${organization?.name ?? "your organization"}.`}
          action={
            canManage ? (
              <Button onClick={() => setShowInvite(!showInvite)}>
                <UserPlus />
                {showInvite ? "Close invitation form" : "Invite a member"}
              </Button>
            ) : undefined
          }
        />
        <p className="text-xs text-muted-foreground">
          {canManage
            ? "Your administrator access applies to this organization only."
            : "You have read-only access to this organization."}
        </p>
        <Metrics
          items={[
            {
              label: "Members",
              value: members.data?.members.length ?? "--",
            },
            {
              label: "Administrators",
              value:
                members.data?.members.filter(
                  (member) => member.role === "organization_admin",
                ).length ?? "--",
            },
            {
              label: "Departments",
              value: structure.data?.departments.length ?? "--",
            },
          ]}
        />
        {showInvite && canManage && (
          <InviteMemberForm
            isPending={invite.isPending}
            onSubmit={submitInvitation}
          />
        )}
        <Tabs defaultValue="people" className="space-y-4">
          <TabsList className="border border-border bg-secondary/60">
            <TabsTrigger value="people">
              <Users />
              People
            </TabsTrigger>
            <TabsTrigger value="structure">
              <Building2 />
              Structure
            </TabsTrigger>
          </TabsList>
          <TabsContent value="people">
            <QueryState loading={members.isLoading} error={members.error}>
              <MemberDirectory
                members={members.data?.members ?? []}
                departments={structure.data?.departments}
                structureError={structure.error}
                canManage={canManage}
                pending={updateRole.isPending}
                onRoleChange={(userId, role) =>
                  updateRole.mutate(
                    { orgId: organizationId, userId, role },
                    {
                      onSuccess: () =>
                        onNotice({
                          type: "success",
                          text: "Member access updated.",
                        }),
                      onError,
                    },
                  )
                }
              />
            </QueryState>
          </TabsContent>
          <TabsContent value="structure">
            <OrganizationStructurePanel
              organizationId={organizationId}
              canManageAccess={canManage}
              members={members.data?.members ?? []}
              membersError={members.error}
              onNotice={onNotice}
            />
          </TabsContent>
        </Tabs>
      </QueryState>
    </DashboardShell>
  );
}
