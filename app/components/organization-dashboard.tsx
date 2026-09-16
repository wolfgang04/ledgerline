"use client";

import { FormEvent, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Filter,
  LayoutGrid,
  LogOut,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import {
  useInviteUserMutation,
  useOrganizationMembersQuery,
  useOrganizationsQuery,
  useUpdateRoleMutation,
} from "../hooks/queries/organization";
import {
  getApiError,
  type Organization,
  type Role,
  type User,
} from "../lib/api";

const roles: Role[] = ["employee", "finance", "manager", "organization_admin"];

type OrganizationDashboardProps = {
  user: User;
  organizationId: number;
  onSignOut: () => void;
  onNotice: (notice: { type: "success" | "error"; text: string }) => void;
};

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: Role;
  onChange?: (value: Role) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      disabled={disabled}
      value={value}
      onChange={(event) => onChange?.(event.target.value as Role)}
    >
      {roles.map((role) => (
        <option key={role} value={role}>
          {role.replace("_", " ")}
        </option>
      ))}
    </Select>
  );
}

export function OrganizationDashboard({
  user,
  organizationId,
  onSignOut,
  onNotice,
}: OrganizationDashboardProps) {
  const router = useRouter();
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
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="brand-mark">⌘</span>
          <span>
            <strong>ledgerline</strong>
            <small>Financial operations</small>
          </span>
        </div>
        <button className="org-switcher" type="button">
          <span className="org-switcher-icon">
            <Building2 size={16} />
          </span>
          <span>
            <strong>{organization.name}</strong>
            <small>Organization workspace</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="sidebar-section-label">Workspace</div>
        <nav className="dashboard-nav">
          <button
            className="nav-item"
            type="button"
            onClick={() => router.push("/")}
          >
            <LayoutGrid size={16} /> Overview
          </button>
          <button className="nav-item" type="button">
            <Mail size={16} /> Budget planning{" "}
            <span className="nav-count">4</span>
          </button>
          <button className="nav-item" type="button">
            <Building2 size={16} /> Budgets
          </button>
          <button className="nav-item active" type="button">
            <Users size={16} /> People & teams
          </button>
          <button className="nav-item" type="button">
            <SlidersHorizontal size={16} /> Activity
          </button>
        </nav>
        <div className="sidebar-user">
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>{user.name}</strong>
            <small>
              {canManageAccess
                ? "Organization administrator"
                : "Organization member"}
            </small>
          </span>
          <button
            className="sidebar-signout"
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-toolbar">
          <div>
            <span className="breadcrumb">
              <button
                className="breadcrumb-link"
                type="button"
                onClick={() => router.push("/")}
              >
                {organization.name}
              </button>
              <ChevronRight size={13} /> People & Access
            </span>
          </div>
          <div className="toolbar-actions">
            <button className="toolbar-button" type="button">
              <CircleHelp size={14} /> Help center
            </button>
            <button
              className="toolbar-icon"
              type="button"
              aria-label="Notifications"
            >
              <Mail size={15} />
            </button>
            <button
              className="toolbar-icon"
              type="button"
              aria-label="Settings"
            >
              <Settings2 size={15} />
            </button>
          </div>
        </header>
        <div className="org-admin-content">
          <section className="org-page-header">
            <div>
              <p className="eyebrow">
                <ShieldCheck size={13} /> Workspace governance
              </p>
              <h1>People & Access</h1>
              <p>
                Keep the right people close to the numbers. Manage membership,
                roles, and the teams that shape {organization.name}&apos;s
                budgets.
              </p>
            </div>
            {canManageAccess && (
              <Button
                className="invite-cta"
                onClick={() => setShowInvite((current) => !current)}
              >
                <Users size={16} /> Invite member <Plus size={15} />
              </Button>
            )}
          </section>
          <div className="access-notice">
            <span className="notice-icon">
              <ShieldCheck size={15} />
            </span>
            <span>
              <strong>Organization-level access</strong>
              <small>
                {canManageAccess
                  ? `Changes here apply only to the ${organization.name} organization.`
                  : "You have read-only access to this organization."}
              </small>
            </span>
            <button type="button">
              <CircleHelp size={14} /> Learn about roles
            </button>
          </div>
          <section className="org-metrics">
            <div>
              <span className="metric-icon mint">
                <Users size={15} />
              </span>
              <small>Last 30 days</small>
              <strong>{members.length}</strong>
              <b>Active members</b>
              <em>Organization members</em>
            </div>
            <div>
              <span className="metric-icon sand">
                <Mail size={15} />
              </span>
              <small>Last 30 days</small>
              <strong>0</strong>
              <b>Pending invites</b>
              <em>Invitation activity</em>
            </div>
            <div>
              <span className="metric-icon lilac">
                <Building2 size={15} />
              </span>
              <small>Last 30 days</small>
              <strong>—</strong>
              <b>Departments</b>
              <em>Structure coming next</em>
            </div>
            <div>
              <span className="metric-icon peach">
                <ShieldCheck size={15} />
              </span>
              <small>Last 30 days</small>
              <strong>
                {
                  members.filter(
                    (member) => member.role === "organization_admin",
                  ).length
                }
              </strong>
              <b>Admin seats</b>
              <em>Organization administrators</em>
            </div>
          </section>
          {showInvite && canManageAccess && (
            <form className="invite-form-card" onSubmit={inviteFromForm}>
              <div>
                <strong>Invite a member</strong>
                <small>
                  Invite an existing Ledgerline account to this organization.
                </small>
              </div>
              <Input
                required
                name="email"
                type="email"
                placeholder="teammate@company.com"
              />
              <Select name="role" defaultValue="employee">
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.replace("_", " ")}
                  </option>
                ))}
              </Select>
              <Button disabled={inviteUser.isPending}>
                {inviteUser.isPending ? "Sending..." : "Send invite"}
              </Button>
            </form>
          )}
          <div className="org-tabs">
            <button className="active" type="button">
              <Users size={14} /> People <span>{members.length}</span>
            </button>
            <button type="button">
              <Building2 size={14} /> Structure
            </button>
            <span className="directory-sync">
              <i /> Directory synced just now
            </span>
          </div>
          <section className="directory-card">
            <header>
              <div>
                <h2>Member directory</h2>
                <p>People with access to this organization</p>
              </div>
              {canManageAccess && (
                <Button variant="ghost" onClick={() => setShowInvite(true)}>
                  <Plus size={15} /> Add member
                </Button>
              )}
            </header>
            <div className="directory-filters">
              <div className="directory-search">
                <Search size={15} />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search people, teams, or departments"
                />
              </div>
              <button type="button">
                <Filter size={14} /> All roles <ChevronDown size={13} />
              </button>
              <button type="button" aria-label="Sort">
                <SlidersHorizontal size={14} />
              </button>
              <button type="button" aria-label="Directory settings">
                <Settings2 size={14} />
              </button>
            </div>
            <div className="directory-table">
              <div className="directory-head">
                <span>Member</span>
                <span>Department</span>
                <span>Team</span>
                <span>Role & access</span>
                <span />
              </div>
              {membersQuery.isLoading ? (
                <div className="dashboard-loading">Loading members...</div>
              ) : visibleMembers.length ? (
                visibleMembers.map((member) => (
                  <div className="directory-row" key={member.id}>
                    <span className="directory-member">
                      <span className="avatar small">
                        {member.first_name.slice(0, 1).toUpperCase()}
                      </span>
                      <span>
                        <strong>
                          {member.first_name} {member.last_name}
                        </strong>
                        <small>{member.email}</small>
                      </span>
                    </span>
                    <span>Finance</span>
                    <span>Finance operations</span>
                    <span>
                      {canManageAccess ? (
                        <RoleSelect
                          value={roleDrafts[member.user_id] ?? member.role}
                          onChange={(role) => {
                            setRoleDrafts((current) => ({
                              ...current,
                              [member.user_id]: role,
                            }));
                            updateRole(member.user_id, role);
                          }}
                        />
                      ) : (
                        <span className="readonly-role">
                          {member.role.replace("_", " ")}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      aria-label={`Actions for ${member.first_name}`}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="dashboard-empty">
                  No members match this search.
                </div>
              )}
            </div>
          </section>
        </div>
        <footer className="dashboard-footer">
          <span>LEDGERLINE / 2026</span>
          <span>Secure financial operations</span>
        </footer>
      </div>
    </section>
  );
}
