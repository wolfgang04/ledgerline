"use client";
import { useState } from "react";
import type { Notify } from "@/components/notice";
import { QueryState } from "@/components/query-state";
import type { OrganizationMember } from "../../types";
import {
  useOrganizationStructureQuery,
  useCreateDepartmentMutation,
} from "@/features/organizations/structure-queries";
import { CreateStructureForm } from "./create-structure-form";
import { DepartmentCard } from "./department-card";
import {
  MemberAssignmentDialog,
  type MemberTarget,
} from "./member-assignment-dialog";
export function OrganizationStructurePanel({
  organizationId,
  canManageAccess,
  members,
  membersError,
  onNotice,
}: {
  organizationId: number;
  canManageAccess: boolean;
  members: OrganizationMember[];
  membersError: unknown;
  onNotice: Notify;
}) {
  const structure = useOrganizationStructureQuery(organizationId);
  const create = useCreateDepartmentMutation();
  const [target, setTarget] = useState<MemberTarget | null>(null);
  return (
    <div className="space-y-4">
      {canManageAccess && (
        <CreateStructureForm
          kind="Department"
          pending={create.isPending}
          onCreate={(name) => create.mutateAsync({ organizationId, name })}
          onNotice={onNotice}
        />
      )}
      <QueryState
        loading={structure.isLoading}
        error={structure.error || membersError}
        empty={
          !structure.data?.departments.length
            ? "No departments yet."
            : undefined
        }
      >
        <div className="space-y-4">
          {structure.data?.departments.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              members={members}
              organizationId={organizationId}
              canManage={canManageAccess}
              onAssign={setTarget}
              onNotice={onNotice}
            />
          ))}
        </div>
      </QueryState>
      {target && (
        <MemberAssignmentDialog
          key={`${target.type}-${target.id}`}
          target={target}
          members={members}
          organizationId={organizationId}
          onClose={() => setTarget(null)}
          onNotice={onNotice}
        />
      )}
    </div>
  );
}
