"use client";

import {
  Search,
  ShieldCheck,
  Users,
  Building2,
  LogOut,
  CircleDollarSign,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { type User } from "../lib/api";
import {
  usePlatformOrganizationsQuery,
  usePlatformOverviewQuery,
  usePlatformUsersQuery,
} from "../hooks/queries/platform";
import { useState } from "react";

export function PlatformDashboard({
  user,
  onSignOut,
}: {
  user: User;
  onSignOut: () => void;
}) {
  const [userSearch, setUserSearch] = useState("");
  const [organizationSearch, setOrganizationSearch] = useState("");
  const overview = usePlatformOverviewQuery();
  const users = usePlatformUsersQuery(userSearch);
  const organizations = usePlatformOrganizationsQuery(organizationSearch);
  const metrics = overview.data?.metrics;

  return (
    <section className="dashboard-app platform-dashboard-app">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="brand-mark">LO</span>
          <span>
            <strong>Ledgerline</strong>
            <small>Platform control</small>
          </span>
        </div>
        <div className="sidebar-section-label">Administration</div>
        <nav className="dashboard-nav">
          <button className="nav-item active" type="button">
            <CircleDollarSign size={16} /> Platform overview
          </button>
          <button className="nav-item" type="button">
            <Users size={16} /> Users <span>{metrics?.users ?? "-"}</span>
          </button>
          <button className="nav-item" type="button">
            <Building2 size={16} /> Organizations{" "}
            <span>{metrics?.organizations ?? "-"}</span>
          </button>
        </nav>
        <div className="sidebar-user">
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>{user.name}</strong>
            <small>Platform administrator</small>
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
              Ledgerline <span>/</span> Platform control
            </span>
            <p className="dashboard-date">System-wide administration</p>
          </div>
          <Badge>platform admin</Badge>
        </header>
        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <p className="eyebrow">Platform administration / overview</p>
              <h1>
                See the whole
                <br />
                <em>operating picture.</em>
              </h1>
              <p>
                Monitor the people, organizations, and access structure powering
                Ledgerline.
              </p>
            </div>
            <div className="welcome-mark">
              <ShieldCheck size={34} strokeWidth={1.4} />
              <span>
                System
                <br />
                protected
              </span>
            </div>
          </section>
          <section className="metric-strip">
            <div>
              <span className="metric-label">Total users</span>
              <strong>{metrics?.users ?? "-"}</strong>
              <small>registered accounts</small>
            </div>
            <div>
              <span className="metric-label">Organizations</span>
              <strong>{metrics?.organizations ?? "-"}</strong>
              <small>active workspaces</small>
            </div>
            <div>
              <span className="metric-label">Memberships</span>
              <strong>{metrics?.memberships ?? "-"}</strong>
              <small>organization relationships</small>
            </div>
          </section>
          <section className="platform-search-grid">
            <div className="platform-search-panel">
              <div className="panel-heading">
                <span>
                  <Users size={17} />
                  <strong>Search users</strong>
                </span>
                <small>up to 25 results</small>
              </div>
              <div className="search-box">
                <Search size={16} />
                <Input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Name or email"
                />
              </div>
              <div className="platform-result-list">
                {users.isLoading ? (
                  <div className="dashboard-loading">Searching users...</div>
                ) : (
                  users.data?.users.map((platformUser) => (
                    <div className="platform-result-row" key={platformUser.id}>
                      <span className="avatar small">
                        {platformUser.first_name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="member-copy">
                        <strong>
                          {platformUser.first_name} {platformUser.last_name}
                        </strong>
                        <small>{platformUser.email}</small>
                      </span>
                      <Badge>{platformUser.role.replace("_", " ")}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="platform-search-panel">
              <div className="panel-heading">
                <span>
                  <Building2 size={17} />
                  <strong>Search organizations</strong>
                </span>
                <small>up to 25 results</small>
              </div>
              <div className="search-box">
                <Search size={16} />
                <Input
                  value={organizationSearch}
                  onChange={(event) =>
                    setOrganizationSearch(event.target.value)
                  }
                  placeholder="Organization name"
                />
              </div>
              <div className="platform-result-list">
                {organizations.isLoading ? (
                  <div className="dashboard-loading">
                    Searching organizations...
                  </div>
                ) : (
                  organizations.data?.organizations.map((organization) => (
                    <div className="platform-result-row" key={organization.id}>
                      <span className="organization-icon">
                        <Building2 size={16} />
                      </span>
                      <span className="member-copy">
                        <strong>{organization.name}</strong>
                        <small>Organization ID {organization.id}</small>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
        <footer className="dashboard-footer">
          <span>LEDGERLINE / 2026</span>
          <span>Platform administration</span>
        </footer>
      </div>
    </section>
  );
}
