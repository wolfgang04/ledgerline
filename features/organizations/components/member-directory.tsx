"use client";
import { useState } from "react";
import { Search, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrganizationMember, Department } from "../types";
import type { Role } from "@/features/auth/types";
import { RoleSelect, formatRole } from "./role-select";
export function MemberDirectory({
  members,
  departments,
  structureError,
  canManage,
  pending,
  onRoleChange,
}: {
  members: OrganizationMember[];
  departments?: Department[];
  structureError: unknown;
  canManage: boolean;
  pending: boolean;
  onRoleChange: (userId: number, role: Role) => void;
}) {
  const [search, setSearch] = useState("");
  const visible = members.filter((member) =>
    `${member.first_name} ${member.last_name} ${member.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-primary" />
          Member directory
        </CardTitle>
        <CardDescription>
          {members.length} people connected to this organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            aria-label="Search members by name or email"
            className="pl-9"
          />
        </div>
        {!!structureError && (
          <Alert variant="destructive">
            Department and team details could not be loaded.
          </Alert>
        )}
        {!visible.length ? (
          <p className="py-6 text-sm text-muted-foreground">
            No members match this search.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Role & access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((member) => {
                const department = departments?.find(
                  (department) => department.id === member.department_id,
                );
                const teams = departments
                  ?.flatMap((department) => department.teams)
                  .filter((team) =>
                    team.members.some(
                      (teamMember) => teamMember.user_id === member.user_id,
                    ),
                  );
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-primary">
                          {member.first_name.slice(0, 1)}
                          {member.last_name.slice(0, 1)}
                        </span>
                        <div>
                          <p className="font-medium">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {departments
                        ? (department?.name ?? "Unassigned")
                        : "Unavailable"}
                    </TableCell>
                    <TableCell>
                      {departments
                        ? teams?.map((team) => team.name).join(", ") ||
                          "Unassigned"
                        : "Unavailable"}
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <RoleSelect
                          value={member.role}
                          disabled={pending}
                          ariaLabel={`Role for ${member.first_name} ${member.last_name}`}
                          onChange={(role) =>
                            onRoleChange(member.user_id, role)
                          }
                        />
                      ) : (
                        <Badge>{formatRole(member.role)}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
