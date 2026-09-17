"use client";

import { Plus, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrganizationPageHeaderProps = {
  organizationName: string;
  canManageAccess: boolean;
  onToggleInvite: () => void;
};

export function OrganizationPageHeader({
  organizationName,
  canManageAccess,
  onToggleInvite,
}: OrganizationPageHeaderProps) {
  return (
    <section className="org-page-header">
      <div>
        <p className="eyebrow">
          <ShieldCheck size={13} /> Workspace governance
        </p>
        <h1>People & Access</h1>
        <p>
          Keep the right people close to the numbers. Manage membership, roles,
          and the teams that shape {organizationName}&apos;s budgets.
        </p>
      </div>
      {canManageAccess && (
        <Button className="invite-cta" onClick={onToggleInvite}>
          <Users size={16} /> Invite member <Plus size={15} />
        </Button>
      )}
    </section>
  );
}
