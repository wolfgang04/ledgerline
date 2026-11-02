export const reviewSteps = [
  "Finance submits",
  "Departments approve",
  "Overall approval",
  "Finance commits",
];

export function reviewStep(stage: string) {
  switch (stage) {
    case "active":
      return 4;
    case "ready_to_commit":
      return 3;
    case "overall_review":
      return 2;
    case "department_review":
      return 1;
    default:
      return 0;
  }
}

export function reviewStatus(stage: string) {
  switch (stage) {
    case "department_review":
      return "Department review in progress";
    case "overall_review":
      return "Ready for overall approval";
    case "ready_to_commit":
      return "Approved · Ready for Finance to commit";
    case "active":
      return "Budget active";
    case "changes_requested":
      return "Changes requested · Awaiting Finance resubmission";
    case "revising":
      return "Finance is preparing a revision";
    default:
      return "Draft · Not yet submitted";
  }
}

export function approvalGuidance({
  editing,
  overallocated,
  included,
  status,
  approved,
  overall,
  stage,
}: {
  editing: boolean;
  overallocated: boolean;
  included: boolean;
  status: string;
  approved: boolean;
  overall: boolean;
  stage: string;
}) {
  if (editing) return "Save or cancel your spending edits before approving.";
  if (overallocated)
    return "The spending breakdown exceeds your allocation. Edit it before approving.";
  if (!included) return "Your department is not included in this proposal.";
  if (status !== "under_review")
    return "Finance must submit the saved changes before you can approve.";
  if (approved) return "You have approved this submitted version.";
  if (overall && stage === "department_review")
    return "All included departments must approve before overall approval.";
  return "Review the saved spending plan and submitted values before approving. You can request changes in Conversations.";
}
