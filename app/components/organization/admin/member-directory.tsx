"use client";

import {
  ChevronDown,
  Filter,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { OrganizationMember, Role } from "../../../lib/api";
import { MemberDirectoryTable } from "./member-directory-table";

type MemberDirectoryProps = {
  members: OrganizationMember[];
  isLoading: boolean;
  canManageAccess: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onAddMember: () => void;
  roleDrafts: Record<number, Role>;
  onRoleChange: (memberId: number, role: Role) => void;
};

export function MemberDirectory({
  members,
  isLoading,
  canManageAccess,
  search,
  onSearchChange,
  onAddMember,
  roleDrafts,
  onRoleChange,
}: MemberDirectoryProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Member directory</CardTitle>
        <CardDescription>
          People with access to this organization
        </CardDescription>
        {canManageAccess && (
          <CardAction>
            <Button variant="ghost" onClick={onAddMember}>
              <Plus size={15} /> Add member
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="directory-filters !border-0 !px-0">
          <div className="directory-search">
            <Search size={15} />
            <Input
              className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
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
        <MemberDirectoryTable
          members={members}
          isLoading={isLoading}
          canManageAccess={canManageAccess}
          roleDrafts={roleDrafts}
          onRoleChange={onRoleChange}
        />
      </CardContent>
    </Card>
  );
}
