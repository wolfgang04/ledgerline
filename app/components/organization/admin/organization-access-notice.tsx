import { CircleHelp, ShieldCheck } from "lucide-react";

type OrganizationAccessNoticeProps = {
  organizationName: string;
  canManageAccess: boolean;
};

export function OrganizationAccessNotice({
  organizationName,
  canManageAccess,
}: OrganizationAccessNoticeProps) {
  return (
    <div className="access-notice">
      <span className="notice-icon">
        <ShieldCheck size={15} />
      </span>
      <span>
        <strong>Organization-level access</strong>
        <small>
          {canManageAccess
            ? `Changes here apply only to the ${organizationName} organization.`
            : "You have read-only access to this organization."}
        </small>
      </span>
      <button type="button">
        <CircleHelp size={14} /> Learn about roles
      </button>
    </div>
  );
}
