"use client";

import { FormEvent, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  CircleDollarSign,
  LogOut,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import {
  useCreateOrganizationMutation,
  useInviteUserMutation,
  useOrganizationMembersQuery,
  useOrganizationsQuery,
  useUpdateRoleMutation,
} from "../hooks/queries/organization";
import { getApiError, type Organization, type Role, type User } from "../lib/api";

const roles: Role[] = ["employee", "finance", "manager", "organization_admin"];

type DashboardProps = {
  user: User;
  onSignOut: () => void;
  onNotice: (notice: { type: "success" | "error"; text: string }) => void;
};

function Field({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return <Label className="dashboard-field">{label}<Input required name={name} type={type} placeholder={placeholder} /></Label>;
}

function RoleSelect({ name = "role" }: { name?: string }) {
  return <Select name={name} defaultValue="employee">{roles.map((role) => <option key={role} value={role}>{role.replace("_", " ")}</option>)}</Select>;
}

function UserSelect({ members }: { members: { user_id: number; first_name: string; last_name: string }[] }) {
  return <Select name="user_id" required defaultValue=""><option value="" disabled>Select a member</option>{members.map((member) => <option key={member.user_id} value={member.user_id}>{member.first_name} {member.last_name}</option>)}</Select>;
}

function OrganizationRow({ organization, selected, onSelect }: { organization: Organization; selected: boolean; onSelect: () => void }) {
  return <button className={`organization-row ${selected ? "selected" : ""}`} type="button" onClick={onSelect}><span className="organization-icon"><Building2 size={16} /></span><span className="organization-copy"><strong>{organization.name}</strong><small>{organization.role?.replace("_", " ") ?? "member"}</small></span><ChevronRight size={16} /></button>;
}

export function Dashboard({ user, onSignOut, onNotice }: DashboardProps) {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const createOrganization = useCreateOrganizationMutation();
  const inviteUser = useInviteUserMutation();
  const updateRole = useUpdateRoleMutation();
  const organizationsQuery = useOrganizationsQuery(true);
  const organizations = organizationsQuery.data?.organizations ?? [];
  const activeOrganizationId = selectedOrganizationId ?? organizations[0]?.id ?? null;
  const activeOrganization = organizations.find(({ id }) => id === activeOrganizationId);
  const membersQuery = useOrganizationMembersQuery(activeOrganizationId);
  const members = membersQuery.data?.members ?? [];

  const success = (text: string) => onNotice({ type: "success", text });
  const failure = (error: unknown) => onNotice({ type: "error", text: getApiError(error) });

  function createOrganizationFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createOrganization.mutate(String(new FormData(event.currentTarget).get("name")), {
      onSuccess: ({ organization: created }) => success(`${created.name} is ready. You are its organization admin.`),
      onError: failure,
    });
  }

  function inviteFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!activeOrganization) return;
    inviteUser.mutate({ id: String(activeOrganization.id), email: String(data.get("email")), role: data.get("role") as Role }, {
      onSuccess: () => success("Invitation created and ready for acceptance."),
      onError: failure,
    });
  }

  function updateRoleFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!activeOrganization) return;
    updateRole.mutate({ orgId: String(activeOrganization.id), userId: String(data.get("user_id")), role: data.get("role") as Role }, {
      onSuccess: ({ member }) => success(`User ${member.user_id} is now a ${member.role.replace("_", " ")}.`),
      onError: failure,
    });
  }

  return <section className="dashboard-app">
    <aside className="dashboard-sidebar">
      <div className="dashboard-brand"><span className="brand-mark">LO</span><span><strong>Ledgerline</strong><small>Finance operations</small></span></div>
      <div className="sidebar-section-label">Workspace</div>
      <nav className="dashboard-nav"><button className="nav-item active" type="button"><CircleDollarSign size={16} /> Overview</button><button className="nav-item" type="button"><Building2 size={16} /> Organizations <span>{organizations.length}</span></button><button className="nav-item" type="button"><Users size={16} /> People</button></nav>
      <div className="sidebar-user"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.email}</small></span><button className="sidebar-signout" type="button" onClick={onSignOut} aria-label="Sign out"><LogOut size={15} /></button></div>
    </aside>
    <div className="dashboard-main">
      <header className="dashboard-toolbar"><div><span className="breadcrumb">Ledgerline <ChevronRight size={13} /> Overview</span><p className="dashboard-date">Wednesday, September 16, 2026</p></div><Badge>{user.role.replace("_", " ")}</Badge></header>
      <div className="dashboard-content">
        <section className="dashboard-welcome"><div><p className="eyebrow">Financial operations / overview</p><h1>Good work starts<br /><em>with clarity.</em></h1><p>Keep your organizations, people, and access decisions in one calm place.</p></div><div className="welcome-mark"><ShieldCheck size={34} strokeWidth={1.4} /><span>Access<br />controlled</span></div></section>
        <section className="metric-strip"><div><span className="metric-label">Organizations</span><strong>{organizations.length}</strong><small>your active workspaces</small></div><div><span className="metric-label">Active members</span><strong>{members.length}</strong><small>{activeOrganization ? `in ${activeOrganization.name}` : "select a workspace"}</small></div><div><span className="metric-label">Current access</span><strong className="metric-access">{user.role.replace("_", " ")}</strong><small>your highest platform role</small></div></section>
        <section className="organization-overview"><div className="section-heading"><div><span className="section-index">03</span><h2>Your organizations</h2><p>Choose a workspace to manage its people and access.</p></div><span className="section-rule" /></div><div className="organization-layout"><div className="organization-list">{organizationsQuery.isLoading ? <div className="dashboard-loading">Loading organizations...</div> : organizations.length ? organizations.map((organization) => <OrganizationRow key={organization.id} organization={organization} selected={organization.id === activeOrganizationId} onSelect={() => setSelectedOrganizationId(organization.id)} />) : <div className="dashboard-empty">No organizations yet. Create your first workspace to get started.</div>}</div><form className="create-organization" onSubmit={createOrganizationFromForm}><div className="inline-heading"><Building2 size={17} /><strong>New workspace</strong></div><p>Create an organization and become its administrator.</p><Field label="Organization name" name="name" placeholder="Northstar Finance" /><Button className="dashboard-button" disabled={createOrganization.isPending}>{createOrganization.isPending ? "Creating..." : "Create organization"}<ArrowUpRight size={16} /></Button></form></div></section>
        {activeOrganization && <section className="organization-dashboard"><div className="section-heading"><div><span className="section-index">04</span><h2>{activeOrganization.name}</h2><p>Organization dashboard / members and access</p></div><Badge>{activeOrganization.role?.replace("_", " ") ?? "member"}</Badge></div><div className="dashboard-grid"><div className="members-panel"><div className="panel-heading"><span><Users size={17} /><strong>Members</strong></span><small>{members.length} people</small></div>{membersQuery.isLoading ? <div className="dashboard-loading">Loading members...</div> : <div className="member-list">{members.map((member) => <div className="member-row" key={member.id}><span className="avatar small">{member.first_name.slice(0, 1).toUpperCase()}</span><span className="member-copy"><strong>{member.first_name} {member.last_name}</strong><small>{member.email}</small></span><Badge>{member.role.replace("_", " ")}</Badge></div>)}</div>}<form className="role-form" onSubmit={updateRoleFromForm}><div className="panel-heading"><span><ShieldCheck size={17} /><strong>Change access</strong></span></div><Label className="dashboard-field">Member<UserSelect members={members} /></Label><Label className="dashboard-field">New role<RoleSelect /></Label><Button className="dashboard-button" disabled={updateRole.isPending}>{updateRole.isPending ? "Updating..." : "Update member role"}<ArrowUpRight size={16} /></Button></form></div><form className="invite-panel" onSubmit={inviteFromForm}><span className="section-index">05</span><div className="invite-icon"><UserPlus size={20} /></div><h3>Invite a teammate</h3><p>Give an existing Ledgerline account access to this organization.</p><Field label="User email" name="email" type="email" placeholder="teammate@company.com" /><Label className="dashboard-field">Initial role<RoleSelect /></Label><Button className="dashboard-button" disabled={inviteUser.isPending}>{inviteUser.isPending ? "Sending..." : "Create invitation"}<ArrowUpRight size={16} /></Button></form></div></section>}
      </div>
      <footer className="dashboard-footer"><span>LEDGERLINE / 2026</span><span>Secure financial operations</span></footer>
    </div>
  </section>;
}
