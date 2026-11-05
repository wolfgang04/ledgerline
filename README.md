# Ledgerline client

The web interface for Ledgerline, a financial operations platform for organizations. It supports account registration, company invitations, people and teams, annual budget planning, staged approvals, spending requests, and reserve funding.

This package contains the frontend and connects to a separately provided Ledgerline API over HTTP. All paths and commands below are relative to this folder, which contains [package.json](package.json).

## Technology

| Area                 | Tools                                             |
| -------------------- | ------------------------------------------------- |
| Framework            | Next.js 16 App Router, React 19, TypeScript       |
| API and server state | Axios, TanStack React Query                       |
| Styling              | Tailwind CSS 4, shared design tokens              |
| Interface components | Base UI, shadcn components, Lucide icons          |
| Fonts                | Self-hosted Public Sans and Geist Mono            |
| Checks               | ESLint, TypeScript, Node.js test runner, Prettier |

## Run locally

You need **Node.js 22.19 or later** and npm. To use authentication, organizations and budgets, you also need the base URL of a running Ledgerline API, supplied by whoever manages your environment. Building the frontend and running its helper tests do not require access to a database.

Open a terminal in this folder:

```sh
npm ci
npm run dev
```

Open **http://localhost:3000**. If that port is occupied, use the URL printed by Next.js, or choose a port explicitly:

```sh
npm run dev -- --port 3001
```

Run every command in this README from this folder. On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`.

### API configuration

The default API base URL is `http://localhost:8080/api`. This is a connection default; the frontend does not start an API on that address. To use the API endpoint supplied for your environment, create `.env.local` alongside `package.json`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

Replace the example value if your API runs elsewhere. Include the `/api` suffix. Requests go directly from the browser to this URL, so it must be reachable from the machine using the app. The API must permit the frontend's origin and accept its JSON requests and bearer authorization headers.

`NEXT_PUBLIC_API_URL` is included in the browser bundle. It must contain only the public API base URL, without credentials or secrets. Restart the development server after changing this value; production builds require a rebuild.

### First sign-in

Open the app and sign in with an account for the configured API environment, or select **Create account** to register. After registration, sign in to continue.

From **Your workspaces**, create an organization or accept an invitation. The creator becomes that organization's administrator and can invite existing accounts, assign roles and organize departments and teams. Finance or an organization administrator configures the currency and fiscal calendar before proposals are created.

Accounts, memberships and financial records come from the configured API environment. This frontend package does not include pre-created demo accounts or a data-seeding command. Sign out before switching accounts.

## Features and access

Organization roles are scoped to each company. A person's access can differ between companies; platform administration is a separate role. The API enforces permissions and data visibility.

| Role                       | Main responsibilities                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Organization administrator | Invite members, manage roles, departments and teams, configure financial settings, and view annual proposals.                   |
| Finance                    | Prepare and submit proposals, activate approved budgets, review manager spending requests, and approve reserve transfers.       |
| Department manager         | Plan and approve the department's allocation, review employee spending, and allocate spending directly to department employees. |
| Overall manager            | Review and approve the whole annual proposal after department approvals.                                                        |
| Employee                   | View department balances and approved categories, submit spending requests, and follow personal requests and allocations.       |
| Platform administrator     | View platform metrics and search users and organizations. Platform access does not grant company membership.                    |

The annual workflow is **Finance saves and submits → every required department manager approves → overall managers approve → Finance activates**. Saving a draft does not submit it. Revisions and spending-plan changes can require renewed approvals.

Spending requests and reserve transfers are separate decisions. Pending requests consume no funds; approved spending becomes a commitment until cancelled. Commitments represent authorization, not payments or actual expenditure. Department managers' own spending requests require Finance approval; employees see their own individual requests and allocations within their assigned department.

## Routes

`[organizationId]` identifies the selected company.

| Route                                                | Purpose                                                                                            |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `/`                                                  | Sign in or create an account; authenticated users see their workspaces or platform administration. |
| `/organizations/[organizationId]`                    | People, invitations, departments and teams.                                                        |
| `/organizations/[organizationId]/overview`           | Finance or department financial overview, balances and review queues.                              |
| `/organizations/[organizationId]/budgets`            | Annual proposals, spending plans, conversations, reviews and activation.                           |
| `/organizations/[organizationId]/spending`           | Spending requests, direct allocations, reserve funding and history.                                |
| `/organizations/[organizationId]/financial-settings` | Organization currency and fiscal calendar; settings lock after the first proposal is created.      |

Workspace links choose an entry point based on membership: Finance and assigned department managers enter the overview, overall managers enter planning, assigned employees enter spending, and administrators enter People & teams.

Budget and spending links use `year`, `proposal`, `request`, and `kind` query parameters to preserve the selected context. The original budget workspace also retains access to spending and commitments.

## Project structure

```text
./
├── app/                    # Routes, providers, global styles and local fonts
├── components/
│   ├── layout/             # Shared workspace shell and navigation
│   └── ui/                 # Reusable interface primitives
├── features/
│   ├── auth/               # Registration, login and session context
│   ├── budgets/            # Planning, review, spending and commitments
│   ├── organizations/      # Workspaces, invitations, members and structure
│   └── platform/           # Platform metrics and searches
├── lib/                    # Shared API client, money/session helpers and tests
└── public/                 # Public static assets
```

Keep feature-specific components, API requests, query hooks and types together. Shared components also handle notices, loading/error states and unsaved-edit protection. The `@/` import alias points to the client package root.

`app/providers.tsx` composes React Query and the session provider. `lib/api.ts` configures Axios, attaches the stored bearer token and clears the current session when protected requests return HTTP 401. Session data is stored in browser local storage, with notifications for session changes across tabs.

Use the existing UI primitives, money helpers and query patterns when extending features. Preserve department privacy, exact money calculations, approval order and immutable history. Global styling and design tokens live in [app/globals.css](app/globals.css); shared controls live in [components/ui/](components/ui/).

## Development commands

| Command             | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Start the development server.                   |
| `npm run lint`      | Check ESLint rules.                             |
| `npm run typecheck` | Check TypeScript without emitting files.        |
| `npm test`          | Run client helper tests in `lib/*.test.mjs`.    |
| `npm run build`     | Create a production build.                      |
| `npm start`         | Serve an existing production build.             |
| `npm run format`    | Rewrite source/config formatting with Prettier. |

Before completing client changes, run:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Client unit tests cover workflow guidance, workspace entry, exact balances and session behavior. They do not need a running API or database. Browser and database integration runners are not included in this package.

For a manual browser check, use an API environment and accounts intended for testing:

1. Register, sign in, reload, and sign out to check session behavior.
2. Create an organization, invite another account, accept the invitation, and verify organization roles and department assignments.
3. As Finance, save and submit a proposal. Complete department and overall approvals with the appropriate accounts, then activate it as Finance.
4. Submit employee spending, approve it as a department manager, and verify the balance and history after reload. Check manager requests and reserve transfers as Finance.
5. Verify that employees cannot view other people's requests, managers see only their department's finances, and navigation works at desktop and mobile widths.

## Production

Set `NEXT_PUBLIC_API_URL` to the endpoint supplied for your deployment before building, then serve the result:

```sh
npm run build
npm start
```

To choose a different frontend port:

```sh
npm start -- --port 3001
```

Deploy the API independently and ensure browsers can reach it. Changing the API URL only when starting an already-built client does not update the bundled value. Fonts are loaded from local files in `app/fonts/`, so builds do not download them.

## Troubleshooting

| Symptom                                            | Check                                                                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Login or workspace requests fail                   | Confirm the API is running, inspect the browser Network panel, and check the configured URL includes `/api`.                  |
| Production requests reach the wrong API            | Set `NEXT_PUBLIC_API_URL`, rebuild, and restart the client.                                                                   |
| Access is denied or a workspace feature is missing | Check membership and role in the selected company. Department managers and employees need the relevant department assignment. |
| A session expires                                  | Sign in again; a protected API request returning 401 clears the current stored session.                                       |
| A proposal cannot be activated                     | Check the submitted version, spending plans, required department approvals and overall approvals.                             |
| A port is occupied                                 | Pass another port to `dev` or `start`, for example `npm start -- --port 3001`.                                                |
