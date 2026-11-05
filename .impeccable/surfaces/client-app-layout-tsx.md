---
version: 1
slug: "client-app-layout-tsx"
primary_target: "client/app/layout.tsx"
related_targets:
  [
    "client/app/globals.css",
    "client/components/layout/dashboard-shell.tsx",
    "client/features/budgets/budget-dashboard.tsx",
    "client/features/auth/components/login-page.tsx",
    "client/features/organizations/components/dashboard.tsx",
    "client/features/organizations/components/organization-dashboard.tsx",
    "client/features/platform/components/platform-dashboard.tsx",
  ]
---

# Ledgerline application redesign

Mode: Operate. Scope: the entire existing application. Preserve the Ledgerline name, product rules, permissions, APIs, and financial evidence. Finance and department managers use this in an ordinary, well-lit office throughout the working day.

## Direction contract

THESIS: Put the budget position and the next decision together, replacing planning-first navigation with an operational financial workspace.

OWN-WORLD: Capital Standard uses graphite navigation, jade actions and selection, warm neutral ground, white surfaces, Public Sans, tabular amounts, compact rows, and offset ledger lines for its mark. Semantic colors identify financial states.

STORY: Finance reads the annual position and reviews decisions; managers read their department plan and authorize spending; members read their plan and private requests. All existing workflows remain accessible.

FIRST VIEWPORT: A collapsible left sidebar and compact context header frame a financial overview. A compact balance statement leads into department comparisons beside a visible decision queue. The signature budget-position bar separates committed authorization, department availability, and reserve, with exact text values. Mobile stacks the same evidence with a navigation drawer.

FORM: User-pinned Capital Standard overrides the assignment; seed:e196880cb6bdb279. Code-led Operate build, no approved comp. The approved plan settles the direction and composition; no second selection round is required.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
