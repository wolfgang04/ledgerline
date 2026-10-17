"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Notify } from "@/components/notice";
import { getApiError } from "@/lib/api";
import type { OrganizationMember } from "../../types";
import {
  useSetMemberDepartmentMutation,
  useTeamMemberMutation,
} from "@/features/organizations/structure-queries";
export type MemberTarget =
  | { type: "department"; id: number; name: string }
  | {
      type: "team";
      id: number;
      name: string;
      departmentId: number;
      existingMemberIds: number[];
    };
export function MemberAssignmentDialog({
  target,
  members,
  organizationId,
  onClose,
  onNotice,
}: {
  target: MemberTarget;
  members: OrganizationMember[];
  organizationId: number;
  onClose: () => void;
  onNotice: Notify;
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const departmentMutation = useSetMemberDepartmentMutation();
  const teamMutation = useTeamMemberMutation();
  const pending = departmentMutation.isPending || teamMutation.isPending;
  const available = [...members]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .filter(
      (member) =>
        (target.type === "team"
          ? member.department_id === target.departmentId &&
            !target.existingMemberIds.includes(member.user_id)
          : member.department_id !== target.id) &&
        `${member.first_name} ${member.last_name} ${member.email}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  const selected = available.find((member) => member.user_id === selectedId);
  function confirm() {
    if (!selected) return;
    const options = {
      onSuccess: () => {
        onNotice({
          type: "success",
          text: `${selected.first_name} ${selected.last_name} added to ${target.name}.`,
        });
        onClose();
      },
      onError: (error: unknown) =>
        onNotice({ type: "error", text: getApiError(error) }),
    };
    if (target.type === "department")
      departmentMutation.mutate(
        { organizationId, userId: selected.user_id, departmentId: target.id },
        options,
      );
    else
      teamMutation.mutate(
        { organizationId, teamId: target.id, userId: selected.user_id },
        options,
      );
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent>
        <DialogTitle className="pr-6 text-lg font-semibold">
          Add member to {target.name}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {target.type === "team"
            ? "Select a member from this team's department."
            : "Select an organization member. Changing departments removes their previous team memberships."}
        </DialogDescription>
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="font-medium">
                {selected.first_name} {selected.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{selected.email}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => setSelectedId(null)}
              >
                Back
              </Button>
              <Button disabled={pending} onClick={confirm}>
                {pending ? "Adding..." : "Confirm assignment"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search members"
              placeholder="Search by name or email"
            />
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {available.length ? (
                available.map((member) => (
                  <Button
                    key={member.user_id}
                    variant="ghost"
                    className="h-auto w-full justify-start whitespace-normal p-3 text-left"
                    onClick={() => setSelectedId(member.user_id)}
                  >
                    <span>
                      <span className="block font-medium">
                        {member.first_name} {member.last_name}
                      </span>
                      <span className="block break-all text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </span>
                  </Button>
                ))
              ) : (
                <p className="py-4 text-sm text-muted-foreground">
                  No eligible members found.
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
