# Ledgerline client

Next.js App Router, React, React Query, Tailwind CSS, and Base UI. See the project [README](../README.md) for setup and architecture, [PRODUCT.md](../PRODUCT.md) for workflows, and [DESIGN.md](../DESIGN.md) for visual decisions.

```sh
npm ci
npm run dev
```

The API defaults to `http://localhost:8080/api`. Override `NEXT_PUBLIC_API_URL` in `.env.local` before building when needed. This variable is public and must not contain credentials.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Feature folders keep their API requests, query hooks, DTOs and components together. Shared UI lives in `components/ui`, layout in `components/layout`, and shared pure helpers in `lib`. Preserve the existing money and privacy rules when changing budget presentation.
