export type FinancialSettings = {
  fiscal_year_start_month: number | null;
  currency: string | null;
  locked: boolean;
};
export type ProposalInput = {
  name: string;
  description: string;
  fiscal_year: number;
  proposed_amount: string;
  allocations: { department_id: number; proposed_amount: string }[];
};
export type BudgetPlan = Omit<
  ProposalInput,
  "proposed_amount" | "description" | "allocations"
> & {
  id: number;
  organization_id: number;
  proposed_amount: string | null;
  description: string | null;
  status:
    | "draft"
    | "under_review"
    | "changes_requested"
    | "revising"
    | "approved"
    | "rejected"
    | "cancelled";
  revision_number: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};

export type Allocation = {
  department_id: number;
  name: string;
  proposed_amount: string;
  spending_plan?: DepartmentSpendingPlan;
};
export type SpendingLine = { category: string; amount: string };
export type SpendingPlanInput = {
  revision_number: number;
  version: number;
  lines: SpendingLine[];
};
export type DepartmentSpendingPlan = {
  department_id: number;
  name: string;
  allocated_amount: string;
  version: number;
  lines: SpendingLine[];
  planned_amount: string;
  unplanned_amount: string;
};
export type BudgetDepartment = { id: number; name: string; eligible: boolean };
export type ProposalSnapshot = {
  name: string;
  description: string | null;
  fiscal_year: number;
  proposed_amount: string | null;
  currency: string | null;
  fiscal_year_start_month: number | null;
  allocations: Allocation[];
  reserve: string | null;
  baseline?: boolean;
};
export type ReviewMessage = {
  id: number;
  created_by: number;
  author_name: string | null;
  created_at: string;
  revision_number: number;
  department_id: number | null;
  kind: "comment" | "request_changes" | "agreement";
  description_comments: string | null;
  request_id: number | null;
  agreed?: boolean;
  agreement_snapshot: ProposalSnapshot | null;
};
export type ProposalDetail = {
  spending_plans: DepartmentSpendingPlan[];
  departments: BudgetDepartment[];
  approval_stage: string;
  approvers: {
    user_id: number;
    name: string;
    department_id: number | null;
    department_name: string | null;
    approved_at: string | null;
  }[];
  committed_budget: {
    id: number;
    status: string;
    approved_at: string | null;
    revision_number: number | null;
    snapshot: ProposalSnapshot | null;
  } | null;
  audit: ProposalAuditEvent[];
  plan: BudgetPlan;
  working: ProposalSnapshot;
  department_id: number | null;
  revisions: {
    id: number;
    revision_number: number;
    snapshot: ProposalSnapshot;
    summary: string;
    author_name: string;
    created_at: string;
  }[];
  messages: ReviewMessage[];
};

export type ProposalAuditEvent = {
  id: number;
  action: string;
  reason: string | null;
  revision_number: number;
  created_by: number | null;
  author_name: string;
  created_at: string;
  changes: {
    field: string;
    department_id: number | null;
    department_name: string | null;
    before: string | number | null;
    after: string | number | null;
  }[];
};

export type BudgetAction =
  | {
      kind: "save-spending-plan";
      planId: number;
      departmentId: number;
      values: SpendingPlanInput;
    }
  | { kind: "approve"; planId: number; updated_at: string }
  | { kind: "commit"; planId: number; updated_at: string }
  | {
      kind: "settings";
      settings: Pick<FinancialSettings, "currency" | "fiscal_year_start_month">;
    }
  | { kind: "create"; values: ProposalInput }
  | {
      kind: "update";
      planId: number;
      updated_at: string;
      values: ProposalInput;
      reason: string;
    }
  | {
      kind: "start-revision";
      planId: number;
      updated_at: string;
      reason: string;
    }
  | { kind: "submit"; planId: number; updated_at: string; summary: string }
  | {
      kind: "message";
      planId: number;
      values: {
        revision_number: number;
        department_id: number | null;
        kind: ReviewMessage["kind"];
        message: string;
        request_id?: number;
        updated_at?: string;
      };
    };
