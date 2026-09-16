"use client";

import { FormEvent } from "react";
import {
  ArrowUpRight,
  BellRing,
  Building2,
  ChevronRight,
  CircleDollarSign,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  useAcceptInvitationMutation,
  useCreateOrganizationMutation,
  useMyInvitationsQuery,
  useOrganizationsQuery,
} from "../hooks/queries/organization";
import { getApiError, type Organization, type User } from "../lib/api";

type DashboardProps = {
  user: User;
  onSignOut: () => void;
  onNotice: (notice: { type: "success" | "error"; text: string }) => void;
};

function Field({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <Label className="dashboard-field">
      {label}
      <Input required name={name} placeholder={placeholder} />
    </Label>
  );
}

function OrganizationRow({
  organization,
  onSelect,
}: {
  organization: Organization;
  onSelect: () => void;
}) {
  return (
    <button className="organization-row" type="button" onClick={onSelect}>
      <span className="organization-icon">
        <Building2 size={16} />
      </span>
      <span className="organization-copy">
        <strong>{organization.name}</strong>
        <small>{organization.role?.replace("_", " ") ?? "member"}</small>
      </span>
      <ChevronRight size={16} />
    </button>
  );
}

export function Dashboard({ user, onSignOut, onNotice }: DashboardProps) {
  const router = useRouter();
  const createOrganization = useCreateOrganizationMutation();
  const acceptInvitation = useAcceptInvitationMutation();
  const organizationsQuery = useOrganizationsQuery(true);
  const invitationsQuery = useMyInvitationsQuery(true);
  const organizations = organizationsQuery.data?.organizations ?? [];
  const invitations = invitationsQuery.data?.invitations ?? [];

  function createOrganizationFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createOrganization.mutate(
      String(new FormData(event.currentTarget).get("name")),
      {
        onSuccess: ({ organization: created }) =>
          onNotice({
            type: "success",
            text: `${created.name} is ready. You are its organization admin.`,
          }),
        onError: (error) =>
          onNotice({ type: "error", text: getApiError(error) }),
      },
    );
  }

  return (
    <section className="dashboard-app">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="brand-mark">LO</span>
          <span>
            <strong>Ledgerline</strong>
            <small>Finance operations</small>
          </span>
        </div>
        <div className="sidebar-section-label">Workspace</div>
        <nav className="dashboard-nav">
          <button className="nav-item active" type="button">
            <CircleDollarSign size={16} /> Overview
          </button>
          <button
            className="nav-item"
            type="button"
            onClick={() =>
              organizations[0] &&
              router.push(`/organizations/${organizations[0].id}`)
            }
          >
            <Building2 size={16} /> Organizations{" "}
            <span>{organizations.length}</span>
          </button>
          <button className="nav-item" type="button">
            <Users size={16} /> People
          </button>
        </nav>
        <div className="sidebar-user">
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
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
              Ledgerline <ChevronRight size={13} /> Overview
            </span>
            <p className="dashboard-date">Wednesday, September 16, 2026</p>
          </div>
          <Badge>{user.role.replace("_", " ")}</Badge>
        </header>
        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <p className="eyebrow">Financial operations / overview</p>
              <h1>
                Good work starts
                <br />
                <em>with clarity.</em>
              </h1>
              <p>
                Keep your organizations, people, and access decisions in one
                calm place.
              </p>
            </div>
            <div className="welcome-mark">
              <ShieldCheck size={34} strokeWidth={1.4} />
              <span>
                Access
                <br />
                controlled
              </span>
            </div>
          </section>
          <section className="metric-strip">
            <div>
              <span className="metric-label">Organizations</span>
              <strong>{organizations.length}</strong>
              <small>your active workspaces</small>
            </div>
            <div>
              <span className="metric-label">Pending invites</span>
              <strong>{invitations.length}</strong>
              <small>awaiting your response</small>
            </div>
            <div>
              <span className="metric-label">Current access</span>
              <strong className="metric-access">
                {user.role.replace("_", " ")}
              </strong>
              <small>your highest platform role</small>
            </div>
          </section>
          {invitations.length > 0 && (
            <section className="invitation-overview">
              <div className="section-heading">
                <div>
                  <span className="section-index">02</span>
                  <h2>Needs your attention</h2>
                  <p>Review invitations to join another organization.</p>
                </div>
                <BellRing size={20} />
              </div>
              <div className="invitation-list">
                {invitations.map((invitation) => (
                  <div className="invitation-row" key={invitation.id}>
                    <span className="organization-icon">
                      <Building2 size={16} />
                    </span>
                    <span className="organization-copy">
                      <strong>{invitation.organization_name}</strong>
                      <small>
                        Invited as {invitation.role.replace("_", " ")}
                      </small>
                    </span>
                    <Button
                      disabled={acceptInvitation.isPending}
                      onClick={() =>
                        acceptInvitation.mutate(invitation.id, {
                          onSuccess: () =>
                            onNotice({
                              type: "success",
                              text: `You joined ${invitation.organization_name}.`,
                            }),
                          onError: (error) =>
                            onNotice({
                              type: "error",
                              text: getApiError(error),
                            }),
                        })
                      }
                    >
                      {acceptInvitation.isPending
                        ? "Accepting..."
                        : "Accept invitation"}
                      <ArrowUpRight size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="organization-overview">
            <div className="section-heading">
              <div>
                <span className="section-index">03</span>
                <h2>Your organizations</h2>
                <p>Choose a workspace to open its dedicated dashboard.</p>
              </div>
              <span className="section-rule" />
            </div>
            <div className="organization-layout">
              <div className="organization-list">
                {organizationsQuery.isLoading ? (
                  <div className="dashboard-loading">
                    Loading organizations...
                  </div>
                ) : organizations.length ? (
                  organizations.map((organization) => (
                    <OrganizationRow
                      key={organization.id}
                      organization={organization}
                      onSelect={() =>
                        router.push(`/organizations/${organization.id}`)
                      }
                    />
                  ))
                ) : (
                  <div className="dashboard-empty">
                    No organizations yet. Create your first workspace to get
                    started.
                  </div>
                )}
              </div>
              <form
                className="create-organization"
                onSubmit={createOrganizationFromForm}
              >
                <div className="inline-heading">
                  <Building2 size={17} />
                  <strong>New workspace</strong>
                </div>
                <p>Create an organization and become its administrator.</p>
                <Field
                  label="Organization name"
                  name="name"
                  placeholder="Northstar Finance"
                />
                <Button
                  className="dashboard-button"
                  disabled={createOrganization.isPending}
                >
                  {createOrganization.isPending
                    ? "Creating..."
                    : "Create organization"}
                  <ArrowUpRight size={16} />
                </Button>
              </form>
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
