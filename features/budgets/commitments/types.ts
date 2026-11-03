export type RequestKind = "spending" | "funding";
export type RequestAction = "approve" | "reject" | "withdraw" | "cancel";
export type CommitmentBudget = {
  id: number;
  name: string;
  fiscal_year: number;
  status: string;
};
export type CommitmentRequest = {
  id: number;
  kind: RequestKind;
  budget_id: number;
  department_id: number;
  created_by: number;
  author_name: string;
  allocated_to_user_id: number | null;
  allocated_to_name: string | null;
  idempotency_key: string | null;
  title: string;
  justification: string;
  amount: string;
  category: string | null;
  approval_role: string;
  status: "pending" | "approved" | "rejected" | "withdrawn" | "cancelled";
  version: number;
  created_at: string;
  actions: Record<RequestAction, boolean>;
};
export type CommitmentDepartment = {
  department_id: number;
  name: string;
  original_allocation: string;
  added_funding: string;
  allocation: string;
  committed: string;
  available: string;
  categories: { category: string | null; planned: string; committed: string }[];
};
export type CommitmentOverview = {
  budget: CommitmentBudget & { currency: string | null };
  categories: string[];
  departments: CommitmentDepartment[];
  totals: { allocation: string; committed: string; available: string };
  remaining_reserve?: string;
};
export type RequestInput = {
  amount: string;
  justification: string;
  title?: string;
  category?: string | null;
};
export type RequestDetail = {
  request: CommitmentRequest;
  history: {
    id: number;
    author_name: string;
    from_status: string | null;
    to_status: string;
    reason: string | null;
    created_at: string;
  }[];
};
export type AllocationInput = {
  allocated_to_user_id: number;
  idempotency_key: string;
  title: string;
  amount: string;
  justification: string;
  category: string | null;
};
