import assert from "node:assert/strict";
import test from "node:test";
import { reviewStep, approvalGuidance } from "../features/budgets/workflow.ts";

test("budget progress follows submission, department review, overall approval and commitment", () => {
  assert.deepEqual(
    [
      "draft",
      "department_review",
      "overall_review",
      "ready_to_commit",
      "active",
    ].map(reviewStep),
    [0, 1, 2, 3, 4],
  );
  assert.equal(reviewStep("changes_requested"), 0);
  assert.equal(reviewStep("revising"), 0);
});

test("approval guidance explains unsaved edits and the department gate before overall approval", () => {
  const base = {
    editing: false,
    overallocated: false,
    included: true,
    status: "under_review",
    approved: false,
    overall: true,
    stage: "department_review",
  };
  assert.match(approvalGuidance(base), /departments must approve/);
  assert.match(approvalGuidance({ ...base, editing: true }), /Save or cancel/);
  assert.match(approvalGuidance({ ...base, overallocated: true }), /exceeds/);
  assert.match(approvalGuidance({ ...base, included: false }), /not included/);
  assert.match(
    approvalGuidance({ ...base, status: "revising" }),
    /Finance must submit/,
  );
  assert.match(approvalGuidance({ ...base, approved: true }), /have approved/);
  assert.match(
    approvalGuidance({ ...base, stage: "overall_review" }),
    /Review the saved/,
  );
});

import { organizationHref } from "../features/organizations/navigation.ts";
test("workspace entry follows the member's financial responsibility", () => {
  assert.equal(
    organizationHref({ id: 3, role: "finance" }),
    "/organizations/3/overview",
  );
  assert.equal(
    organizationHref({ id: 3, role: "manager", department_id: 1 }),
    "/organizations/3/overview",
  );
  assert.equal(
    organizationHref({ id: 3, role: "manager" }),
    "/organizations/3/budgets",
  );
  assert.equal(
    organizationHref({ id: 3, role: "employee", department_id: 1 }),
    "/organizations/3/spending",
  );
  for (const role of ["organization_admin", "employee", null])
    assert.equal(organizationHref({ id: 3, role }), "/organizations/3");
});

import { sumFinancialAmounts, financialPercentage } from "./budget.ts";
test("overview balances and utilization use exact decimal amounts", () => {
  assert.equal(sumFinancialAmounts(["0.10", "0.20"]), "0.30");
  assert.equal(sumFinancialAmounts(["9999999999.98", "0.01"]), "9999999999.99");
  assert.equal(sumFinancialAmounts(["90000.00", "10000.00"]), "100000.00");
  assert.equal(sumFinancialAmounts(["-1"]), null);
  assert.equal(financialPercentage("1.00", "3.00"), 33.33);
  assert.equal(financialPercentage("0", "0"), 0);
  assert.equal(financialPercentage("1.001", "10"), null);
});
