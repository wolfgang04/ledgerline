"use client";

import {
  Building2,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Mail,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "../../../lib/api";

type OrganizationSidebarProps = {
  organizationName: string;
  user: User;
  canManageAccess: boolean;
  onSignOut: () => void;
};

export function OrganizationSidebar({
  organizationName,
  user,
  canManageAccess,
  onSignOut,
}: OrganizationSidebarProps) {
  const router = useRouter();

  return (
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
          <strong>{organizationName}</strong>
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
  );
}
