"use client";

import { Building2, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import {
  useCreateDepartmentMutation,
  useCreateTeamMutation,
  useDeleteDepartmentMutation,
  useOrganizationStructureQuery,
  useSetMemberDepartmentMutation,
  useTeamMemberMutation,
} from "../../../../hooks/queries/organization";
import { getApiError, type OrganizationMember } from "../../../../lib/api";

type OrganizationStructurePanelProps = {
  organizationId: number;
  canManageAccess: boolean;
  members: OrganizationMember[];
  onNotice: (notice: { type: "success" | "error"; text: string }) => void;
};

type MemberTarget =
  | { type: "department"; id: number; name: string }
  | {
      type: "team";
      id: number;
      name: string;
      departmentId: number;
      existingMemberIds: number[];
    };

export function OrganizationStructurePanel({
  organizationId,
  canManageAccess,
  members,
  onNotice,
}: OrganizationStructurePanelProps) {
  const structureQuery = useOrganizationStructureQuery(organizationId);
  const createDepartmentMutation = useCreateDepartmentMutation();
  const createTeamMutation = useCreateTeamMutation();
  const deleteDepartmentMutation = useDeleteDepartmentMutation();
  const setMemberDepartmentMutation = useSetMemberDepartmentMutation();
  const teamMemberMutation = useTeamMemberMutation();
  const [memberTarget, setMemberTarget] = useState<MemberTarget | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  const showError = (error: unknown) =>
    onNotice({ type: "error", text: getApiError(error) });

  const memberName = (member: OrganizationMember) =>
    `${member.first_name} ${member.last_name}`;

  const availableMembers = useMemo(
    () =>
      [...members]
        .sort(
          (left, right) =>
            new Date(right.created_at).getTime() -
            new Date(left.created_at).getTime(),
        )
        .filter((member) => {
          if (
            memberTarget?.type === "team" &&
            (member.department_id !== memberTarget.departmentId ||
              memberTarget.existingMemberIds.includes(member.user_id))
          ) {
            return false;
          }

          return `${memberName(member)} ${member.email}`
            .toLowerCase()
            .includes(memberSearch.toLowerCase());
        }),
    [members, memberSearch, memberTarget],
  );

  const selectedMember = members.find(
    (member) => member.user_id === selectedMemberId,
  );

  function openMemberModal(target: MemberTarget) {
    setMemberTarget(target);
    setMemberSearch("");
    setSelectedMemberId(null);
    setConfirming(false);
  }

  function closeMemberModal() {
    setMemberTarget(null);
    setSelectedMemberId(null);
    setConfirming(false);
  }

  function confirmMemberAssignment() {
    if (!memberTarget || !selectedMember) return;
    const onSuccess = () => {
      onNotice({
        type: "success",
        text: `${memberName(selectedMember)} added to ${memberTarget.name}.`,
      });
      closeMemberModal();
    };
    const options = { onSuccess, onError: showError };
    if (memberTarget.type === "department") {
      setMemberDepartmentMutation.mutate(
        {
          organizationId,
          userId: selectedMember.user_id,
          departmentId: memberTarget.id,
        },
        options,
      );
    } else {
      teamMemberMutation.mutate(
        {
          organizationId,
          teamId: memberTarget.id,
          userId: selectedMember.user_id,
        },
        options,
      );
    }
  }

  return (
    <Card className="">
      <header className="flex items-start justify-between gap-4 border-b pb-4 px-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--ink)]">
            <Building2 size={16} /> Organization structure
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Departments and teams inside this organization
          </p>
        </div>
        {canManageAccess && (
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const name = new FormData(form).get("departmentName");
              createDepartmentMutation.mutate(
                { organizationId, name: String(name ?? "") },
                {
                  onSuccess: () => {
                    form.reset();
                    onNotice({ type: "success", text: "Department created." });
                  },
                  onError: showError,
                },
              );
            }}
          >
            <Input
              required
              name="departmentName"
              placeholder="Department name"
              aria-label="Department name"
              className="h-9 w-40"
            />
            <Button type="submit" disabled={createDepartmentMutation.isPending}>
              <Plus size={14} /> Department
            </Button>
          </form>
        )}
      </header>

      {structureQuery.isLoading ? (
        <p className="text-sm text-[var(--muted)]">Loading structure...</p>
      ) : structureQuery.isError ? (
        <p className="text-sm text-red-600">
          Unable to load organization structure.
        </p>
      ) : structureQuery.data?.departments.length ? (
        <div className="space-y-4">
          {structureQuery.data.departments.map((department) => (
            <section
              key={department.id}
              className="border-b pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex justify-between px-4">
                <div>
                  <h3 className="font-medium text-[var(--ink)]">
                    {department.name}
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    {department.member_count} member
                    {department.member_count === 1 ? "" : "s"} ·{" "}
                    {department.teams.length} team
                    {department.teams.length === 1 ? "" : "s"}
                  </p>
                </div>
                {canManageAccess && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={deleteDepartmentMutation.isPending}
                      onClick={() => {
                        if (!window.confirm(`Remove ${department.name}?`))
                          return;
                        deleteDepartmentMutation.mutate(
                          { organizationId, departmentId: department.id },
                          {
                            onSuccess: () =>
                              onNotice({
                                type: "success",
                                text: `${department.name} removed.`,
                              }),
                            onError: showError,
                          },
                        );
                      }}
                    >
                      <Trash2 size={13} /> Remove
                    </Button>
                  </div>
                )}
                {canManageAccess && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      openMemberModal({
                        type: "department",
                        id: department.id,
                        name: department.name,
                      })
                    }
                  >
                    <Plus size={13} /> Add member
                  </Button>
                )}
                {canManageAccess && (
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = event.currentTarget;
                      const name = new FormData(form).get("teamName");
                      createTeamMutation.mutate(
                        {
                          organizationId,
                          departmentId: department.id,
                          name: String(name ?? ""),
                        },
                        {
                          onSuccess: () => {
                            form.reset();
                            onNotice({
                              type: "success",
                              text: "Team created.",
                            });
                          },
                          onError: showError,
                        },
                      );
                    }}
                  >
                    <Input
                      required
                      name="teamName"
                      placeholder="Team name"
                      aria-label={`Team name for ${department.name}`}
                      className="h-8 w-32"
                    />
                    <Button
                      type="submit"
                      variant="ghost"
                      disabled={createTeamMutation.isPending}
                    >
                      <Plus size={13} /> Team
                    </Button>
                  </form>
                )}
              </div>

              {department.teams.length ? (
                <div className="mt-3 space-y-2 pl-4 mx-4">
                  {department.teams.map((team) => (
                    <div
                      key={team.id}
                      className="space-y-2 border-l-2 border-[var(--orange)] pl-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[var(--ink)]">{team.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--muted)]">
                            {team.members.length} member
                            {team.members.length === 1 ? "" : "s"}
                          </span>
                          {canManageAccess && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                openMemberModal({
                                  type: "team",
                                  id: team.id,
                                  name: team.name,
                                  departmentId: department.id,
                                  existingMemberIds: team.members.map(
                                    (teamMember) => teamMember.user_id,
                                  ),
                                })
                              }
                            >
                              <Plus size={12} /> Add member
                            </Button>
                          )}
                        </div>
                      </div>
                      {team.members.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {team.members.map((teamMember) => (
                            <span
                              key={teamMember.user_id}
                              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
                            >
                              {teamMember.first_name} {teamMember.last_name}
                              {canManageAccess && (
                                <button
                                  type="button"
                                  aria-label={`Remove ${teamMember.first_name} from ${team.name}`}
                                  className="text-muted-foreground hover:text-foreground"
                                  disabled={teamMemberMutation.isPending}
                                  onClick={() =>
                                    teamMemberMutation.mutate(
                                      {
                                        organizationId,
                                        teamId: team.id,
                                        userId: teamMember.user_id,
                                        remove: true,
                                      },
                                      {
                                        onSuccess: () =>
                                          onNotice({
                                            type: "success",
                                            text: "Member removed from team.",
                                          }),
                                        onError: showError,
                                      },
                                    )
                                  }
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 pl-4 text-xs text-[var(--muted)]">
                  No teams yet.
                </p>
              )}
              <div className="mt-3 mx-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-[var(--muted)]">Members:</span>
                {members
                  .filter((member) => member.department_id === department.id)
                  .map((member) => (
                    <span
                      key={member.user_id}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
                    >
                      {memberName(member)}
                      {canManageAccess && (
                        <button
                          type="button"
                          aria-label={`Remove ${memberName(member)} from ${department.name}`}
                          disabled={setMemberDepartmentMutation.isPending}
                          onClick={() =>
                            setMemberDepartmentMutation.mutate(
                              {
                                organizationId,
                                userId: member.user_id,
                                departmentId: null,
                              },
                              {
                                onSuccess: () =>
                                  onNotice({
                                    type: "success",
                                    text: `${memberName(member)} removed from ${department.name}.`,
                                  }),
                                onError: showError,
                              },
                            )
                          }
                        >
                          <X size={12} />
                        </button>
                      )}
                    </span>
                  ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="text-sm px-4 text-[var(--muted)]">No departments yet.</p>
      )}

      {memberTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMemberModal();
          }}
        >
          <section
            aria-labelledby="add-member-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="add-member-title"
                  className="text-base font-semibold text-[var(--ink)]"
                >
                  {confirming
                    ? "Confirm member assignment"
                    : `Add member to ${memberTarget.name}`}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {confirming
                    ? "Review the selection before applying this change."
                    : "Search organization members, newest additions first."}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={closeMemberModal}
              >
                <X size={18} />
              </button>
            </div>

            {confirming && selectedMember ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-lg border p-4">
                  <strong>{memberName(selectedMember)}</strong>
                  <p className="text-sm text-[var(--muted)]">
                    {selectedMember.email}
                  </p>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  Add this member to <strong>{memberTarget.name}</strong>?
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setConfirming(false)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={
                      setMemberDepartmentMutation.isPending ||
                      teamMemberMutation.isPending
                    }
                    onClick={confirmMemberAssignment}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-5 flex items-center gap-2 rounded-md border px-3">
                  <Search size={15} className="text-[var(--muted)]" />
                  <Input
                    autoFocus
                    value={memberSearch}
                    onChange={(event) => setMemberSearch(event.target.value)}
                    placeholder="Search by name or email"
                    aria-label="Search members"
                    className="h-9 border-0"
                  />
                </div>
                <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
                  {availableMembers.length ? (
                    availableMembers.map((member) => (
                      <button
                        key={member.user_id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-md p-3 text-left hover:bg-muted"
                        onClick={() => {
                          setSelectedMemberId(member.user_id);
                          setConfirming(true);
                        }}
                      >
                        <span>
                          <strong className="block text-sm text-[var(--ink)]">
                            {memberName(member)}
                          </strong>
                          <small className="text-xs text-[var(--muted)]">
                            {member.email}
                          </small>
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          {member.role.replace("_", " ")}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="py-6 text-center text-sm text-[var(--muted)]">
                      No members found.
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </Card>
  );
}
