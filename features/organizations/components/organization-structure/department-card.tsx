"use client";
import { useState } from "react";
import { Building2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Notify } from "@/components/notice";
import { getApiError } from "@/lib/api";
import type { Department, OrganizationMember } from "../../types";
import {
  useCreateTeamMutation,
  useDeleteDepartmentMutation,
  useSetMemberDepartmentMutation,
  useTeamMemberMutation,
} from "@/features/organizations/structure-queries";
import { CreateStructureForm } from "./create-structure-form";
import type { MemberTarget } from "./member-assignment-dialog";
function MemberChip({
  name,
  pending,
  onRemove,
}: {
  name: string;
  pending: boolean;
  onRemove?: () => void;
}) {
  return (
    <Badge className="gap-1">
      {name}
      {onRemove && (
        <Button
          size="icon-xs"
          variant="ghost"
          disabled={pending}
          onClick={onRemove}
          aria-label={`Remove ${name}`}
        >
          <X />
        </Button>
      )}
    </Badge>
  );
}
export function DepartmentCard({
  department,
  members,
  organizationId,
  canManage,
  onAssign,
  onNotice,
}: {
  department: Department;
  members: OrganizationMember[];
  organizationId: number;
  canManage: boolean;
  onAssign: (target: MemberTarget) => void;
  onNotice: Notify;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const createTeam = useCreateTeamMutation();
  const deleteDepartment = useDeleteDepartmentMutation();
  const setDepartment = useSetMemberDepartmentMutation();
  const teamMember = useTeamMemberMutation();
  const onError = (error: unknown) =>
    onNotice({ type: "error", text: getApiError(error) });
  const removed = {
    onSuccess: () => onNotice({ type: "success", text: "Membership updated." }),
    onError,
  };
  const departmentMembers = members.filter(
    (member) => member.department_id === department.id,
  );
  return (
    <Card>
      <CardHeader className="border-b bg-accent/35">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4 text-primary" />
          {department.name}
        </CardTitle>
        <CardDescription>
          {departmentMembers.length} members / {department.teams.length} teams
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                onAssign({
                  type: "department",
                  id: department.id,
                  name: department.name,
                })
              }
            >
              Add member
            </Button>
            <Dialog
              open={confirmDelete}
              onOpenChange={(open) => {
                if (!deleteDepartment.isPending) setConfirmDelete(open);
              }}
            >
              <DialogTrigger render={<Button variant="destructive" />}>
                Remove department
              </DialogTrigger>
              <DialogContent>
                <DialogTitle className="pr-6 text-lg font-semibold">
                  Remove {department.name}?
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Only an empty department without budget allocations can be
                  removed.
                </DialogDescription>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    disabled={deleteDepartment.isPending}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleteDepartment.isPending}
                    onClick={() =>
                      deleteDepartment.mutate(
                        { organizationId, departmentId: department.id },
                        {
                          onSuccess: () => {
                            setConfirmDelete(false);
                            onNotice({
                              type: "success",
                              text: "Department removed.",
                            });
                          },
                          onError,
                        },
                      )
                    }
                  >
                    {deleteDepartment.isPending
                      ? "Removing..."
                      : "Remove department"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {departmentMembers.length ? (
            departmentMembers.map((member) => (
              <MemberChip
                key={member.user_id}
                name={`${member.first_name} ${member.last_name}`}
                pending={setDepartment.isPending}
                onRemove={
                  canManage
                    ? () =>
                        setDepartment.mutate(
                          {
                            organizationId,
                            userId: member.user_id,
                            departmentId: null,
                          },
                          removed,
                        )
                    : undefined
                }
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No department members yet.
            </p>
          )}
        </div>
        {canManage && (
          <CreateStructureForm
            kind="Team"
            pending={createTeam.isPending}
            onCreate={(name) =>
              createTeam.mutateAsync({
                organizationId,
                departmentId: department.id,
                name,
              })
            }
            onNotice={onNotice}
          />
        )}
        <div className="space-y-3">
          {department.teams.map((team) => (
            <section
              key={team.id}
              className="space-y-3 rounded-xl border border-l-4 border-l-primary/40 bg-background/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 font-medium">
                    <Users className="size-3.5 text-primary" />
                    {team.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {team.members.length} members
                  </p>
                </div>
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onAssign({
                        type: "team",
                        id: team.id,
                        name: team.name,
                        departmentId: department.id,
                        existingMemberIds: team.members.map(
                          (member) => member.user_id,
                        ),
                      })
                    }
                  >
                    Add member
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {team.members.length ? (
                  team.members.map((member) => (
                    <MemberChip
                      key={member.user_id}
                      name={`${member.first_name} ${member.last_name}`}
                      pending={teamMember.isPending}
                      onRemove={
                        canManage
                          ? () =>
                              teamMember.mutate(
                                {
                                  organizationId,
                                  teamId: team.id,
                                  userId: member.user_id,
                                  remove: true,
                                },
                                removed,
                              )
                          : undefined
                      }
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No team members yet.
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
