"use client";

import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrganizationMember, Role } from "../../../lib/api";
import { formatRole, RoleSelect } from "./role-select";

type MemberDirectoryTableProps = {
  members: OrganizationMember[];
  isLoading: boolean;
  canManageAccess: boolean;
  roleDrafts: Record<number, Role>;
  onRoleChange: (memberId: number, role: Role) => void;
};

export function MemberDirectoryTable({
  members,
  isLoading,
  canManageAccess,
  roleDrafts,
  onRoleChange,
}: MemberDirectoryTableProps) {
  if (isLoading) {
    return (
      <div className="dashboard-loading px-4 py-6">Loading members...</div>
    );
  }

  if (!members.length) {
    return (
      <div className="dashboard-empty px-4 py-6">
        No members match this search.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Role & access</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
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
            </TableCell>
            <TableCell>Finance</TableCell>
            <TableCell>Finance operations</TableCell>
            <TableCell>
              {canManageAccess ? (
                <RoleSelect
                  value={roleDrafts[member.user_id] ?? member.role}
                  onChange={(role) => onRoleChange(member.user_id, role)}
                />
              ) : (
                <span className="readonly-role">{formatRole(member.role)}</span>
              )}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Actions for ${member.first_name}`}
                  className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted"
                >
                  <MoreHorizontal size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    Member actions coming soon
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
