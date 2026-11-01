import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatBudgetTimestamp } from "@/lib/budget";
import { DepartmentSpendingPlanPanel } from "./department-spending-plan";
import type { ProposalDetail, SpendingPlanInput } from "./queries";

export function BudgetReviewPanel({
  detail,
  manager,
  finance,
  userId,
  pending,
  onSaveSpendingPlan,
  onApprove,
  onCommit,
}: {
  detail: ProposalDetail;
  manager: boolean;
  finance: boolean;
  userId: number | undefined;
  pending: boolean;
  onSaveSpendingPlan: (
    departmentId: number,
    values: SpendingPlanInput,
  ) => Promise<void>;
  onApprove: () => void;
  onCommit: () => void;
}) {
  const [spendingEditing, setSpendingEditing] = useState(false);
  const myApproval = detail.approvers.find(
    (approver) => approver.user_id === userId,
  );
  const spendingOverallocated = detail.spending_plans.some(
    (plan) =>
      plan.department_id === detail.department_id &&
      plan.unplanned_amount.startsWith("-"),
  );
  const allApproved = detail.approval_stage === "ready_to_commit";
  const managerAction = manager &&
    !detail.committed_budget &&
    !!detail.plan.revision_number && (
      <>
        <Button
          disabled={
            pending ||
            spendingEditing ||
            spendingOverallocated ||
            !!myApproval?.approved_at ||
            !myApproval ||
            detail.plan.status !== "under_review" ||
            (detail.department_id === null &&
              detail.approval_stage !== "overall_review")
          }
          onClick={onApprove}
        >
          {myApproval?.approved_at
            ? "Approval recorded"
            : detail.department_id === null
              ? "Approve whole proposal"
              : "Approve department budget"}
        </Button>
        <p className="text-sm text-muted-foreground">
          {spendingEditing
            ? "Save or cancel your spending edits before approving."
            : spendingOverallocated
              ? "The spending breakdown exceeds your allocation. Edit it before approving."
              : !myApproval
                ? "Your department is not included in this proposal."
                : detail.plan.status !== "under_review"
                  ? "Finance must submit the saved changes before you can approve."
                  : myApproval.approved_at
                    ? "You have approved this submitted version."
                    : detail.department_id === null &&
                        detail.approval_stage === "department_review"
                      ? "All included departments must approve before overall approval."
                      : "Review the saved spending plan and submitted values before approving. You can request changes in Conversations."}
        </p>
      </>
    );
  return (
    <section
      aria-label="Budget planning and approval"
      className="space-y-4 rounded-xl border p-4"
    >
      <h3 className="font-semibold">Budget planning and approval</h3>
      <p>
        {(
          {
            department_review: "Waiting for department approvals",
            overall_review: "Waiting for overall approval",
            ready_to_commit: "Approved, awaiting Finance commitment",
            active: "Active budget",
            changes_requested:
              "Changes requested. Finance must resubmit for review",
            revising: "Finance is preparing a revision",
          } as Record<string, string>
        )[detail.approval_stage] ?? detail.approval_stage.replaceAll("_", " ")}
      </p>
      <p className="text-sm text-muted-foreground">
        Annual department spending plans - FY {detail.plan.fiscal_year}.{" "}
        {detail.plan.revision_number
          ? `Approvals apply to submitted version ${detail.plan.revision_number}. Resubmission starts a fresh approval round.`
          : "Submit the proposal before department review."}
      </p>
      {!detail.spending_plans.length && (
        <p className="text-sm text-muted-foreground">
          No department spending breakdowns were recorded for this budget.
        </p>
      )}
      {detail.spending_plans.map((plan) => (
        <DepartmentSpendingPlanPanel
          key={plan.department_id}
          plan={plan}
          revision={detail.plan.revision_number}
          currency={detail.working.currency ?? ""}
          editable={
            manager &&
            detail.department_id === plan.department_id &&
            detail.plan.status === "under_review" &&
            !detail.committed_budget
          }
          pending={pending}
          onEditingChange={setSpendingEditing}
          onSave={(values) => onSaveSpendingPlan(plan.department_id, values)}
          approval={
            <>
              <h5 className="font-medium">Department approval</h5>
              <ul className="space-y-1 text-sm">
                {detail.approvers
                  .filter(
                    (approver) => approver.department_id === plan.department_id,
                  )
                  .map((approver) => (
                    <li key={approver.user_id}>
                      {approver.name}:{" "}
                      {approver.approved_at
                        ? `Approved ${formatBudgetTimestamp(approver.approved_at)}`
                        : "Awaiting approval"}
                    </li>
                  ))}
              </ul>
              {detail.department_id === plan.department_id && managerAction}
            </>
          }
        />
      ))}
      {detail.department_id !== null &&
        !detail.spending_plans.some(
          (plan) => plan.department_id === detail.department_id,
        ) &&
        managerAction}
      {detail.approvers.some(
        (approver) =>
          approver.department_id !== null &&
          !detail.spending_plans.some(
            (plan) => plan.department_id === approver.department_id,
          ),
      ) && (
        <>
          <h4 className="font-medium">Recorded department approvals</h4>
          <ul className="space-y-1 text-sm">
            {detail.approvers
              .filter(
                (approver) =>
                  approver.department_id !== null &&
                  !detail.spending_plans.some(
                    (plan) => plan.department_id === approver.department_id,
                  ),
              )
              .map((approver) => (
                <li key={approver.user_id}>
                  {approver.department_name}: {approver.name}:{" "}
                  {approver.approved_at
                    ? `Approved ${formatBudgetTimestamp(approver.approved_at)}`
                    : "Awaiting approval"}
                </li>
              ))}
          </ul>
        </>
      )}
      {!!detail.plan.revision_number && detail.department_id === null && (
        <div className="space-y-3 border-t pt-4">
          <h4 className="font-medium">Overall proposal approval</h4>
          {!detail.approvers.some(
            (approver) => approver.department_id === null,
          ) && (
            <Alert>
              No overall manager is assigned. Ask an administrator to assign one
              before commitment.
            </Alert>
          )}
          <ul className="space-y-1 text-sm">
            {detail.approvers
              .filter((approver) => approver.department_id === null)
              .map((approver) => (
                <li key={approver.user_id}>
                  {approver.name}:{" "}
                  {approver.approved_at
                    ? `Approved ${formatBudgetTimestamp(approver.approved_at)}`
                    : "Awaiting approval"}
                </li>
              ))}
          </ul>
          {managerAction}
          {finance && !detail.committed_budget && (
            <>
              <Button disabled={pending || !allApproved} onClick={onCommit}>
                Commit approved budget
              </Button>
              {!allApproved && (
                <p className="text-sm text-muted-foreground">
                  Commitment becomes available after department and overall
                  approvals of the submitted version.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
