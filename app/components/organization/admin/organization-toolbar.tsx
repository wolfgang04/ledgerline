"use client";

import { ChevronRight, CircleHelp, Mail, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";

type OrganizationToolbarProps = {
  organizationName: string;
};

export function OrganizationToolbar({
  organizationName,
}: OrganizationToolbarProps) {
  const router = useRouter();

  return (
    <header className="dashboard-toolbar">
      <div>
        <span className="breadcrumb">
          <button
            className="breadcrumb-link"
            type="button"
            onClick={() => router.push("/")}
          >
            {organizationName}
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
        <button className="toolbar-icon" type="button" aria-label="Settings">
          <Settings2 size={15} />
        </button>
      </div>
    </header>
  );
}
