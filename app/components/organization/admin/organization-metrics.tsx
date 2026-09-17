import { Building2, Mail, ShieldCheck, Users } from "lucide-react";
import type { OrganizationMember } from "../../../lib/api";

type OrganizationMetricsProps = {
  members: OrganizationMember[];
};

export function OrganizationMetrics({ members }: OrganizationMetricsProps) {
  const adminCount = members.filter(
    (member) => member.role === "organization_admin",
  ).length;

  return (
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
        <strong>{adminCount}</strong>
        <b>Admin seats</b>
        <em>Organization administrators</em>
      </div>
    </section>
  );
}
