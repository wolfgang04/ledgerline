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

Mode: Operate. Scope: authentication, workspace overview, people and teams, budgets, platform administration, and shared controls. Primary users are Finance and managers. Preserve product rules, identity assets, permissions, and financial evidence.

## Direction contract

THESIS: Make the next financial decision legible; replace decorative dashboard banners and scattered action panels with a consistent task workspace.

OWN-WORLD: Civic Record uses an indigo navigation rail, cool pale canvas, white work surfaces, restrained cobalt actions, semantic state colors, Geist typography, precise tabular money, and consistent compact controls.

STORY: Users identify the workspace, fiscal period, current review stage, saved evidence, and next permitted action; department spending and approval stay together.

FIRST VIEWPORT: Familiar navigation at left, a compact context header, page title and primary action, real summary numbers, then the current work. Budget details lead with a four-stage progress strip and department review. Mobile navigation collapses; data and actions stack without horizontal page overflow.

FORM: Modernist public-service identity systems, candidate 4 of seven grounded directions; seed:5c394a943aa4f5fe. User chose Civic Record on the direction board. Code-led application build; no approved comp exists.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
