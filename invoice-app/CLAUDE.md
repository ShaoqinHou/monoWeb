# Xero Replica — Companion App for Xero Users

A 1:1 replica of the Xero web application (UI design + features) built as a companion app for Xero users.

## CRITICAL SAFETY RULES

- **ONLY use Demo Company (NZ)** when exploring Xero via Playwriter. NEVER interact with EZ Chartered Accountant.
- Demo Company URL: `https://go.xero.com/app/!2Z5r1/homepage`
- You CAN view AND edit Demo Company data (it resets). You CANNOT touch EZ data.
- Before ANY Playwriter action on Xero, verify the page shows "Demo Company (NZ)" in the header.
- Chrome Profile 9 (`--profile-directory="Profile 9"`) is the akountforfun account with Xero access.

## Tech Stack

| Layer | Tool | Version |
|-------|------|---------|
| Build | Vite | latest |
| UI Framework | React | 19.x |
| Router | TanStack Router | v1 stable |
| Server State | TanStack Query | v5 |
| API Server | Hono | latest |
| Database | SQLite + Drizzle | existing |
| Validation | Zod | v4 |
| Components | shadcn/ui | latest |
| Forms | React Hook Form | v7 |
| Charts | Recharts | v3 |
| Icons | Lucide React | latest |
| Styling | Tailwind CSS | v4 |
| Testing | Vitest | v4 |
| Browser | Playwriter | CLI + extension |

## Workflow

This project follows a strict TDD workflow. Read `.claude/workflow/CLAUDE.md` for the full process.

**Quick reference — the 7 phases:**

1. **Research** — Use Playwriter to explore live Xero Demo Company (NZ)
2. **Design** — Architecture, modules, tests → `.claude/workflow/design/`
3. **Scaffold** — Create folder structure
4. **Tests** — Write tests BEFORE implementation (red phase)
5. **Implement** — Make tests pass (green phase)
6. **Verify** — Browser verification via Playwriter (HARD GATE)
7. **Review** — Code quality, test coverage, security

## Model Requirements

- **Lead agent**: Opus 4.6 — do NOT use Sonnet or Haiku for the main session
- **All teammates/subagents**: Sonnet 4.6 — always pass `model: "sonnet"` when spawning via Task tool

## Critical Gotchas

1. **Test runner**: Always use `npm test` NOT `npx vitest run`. The root vitest run lacks `@shared` alias and causes 1382+ failures.
2. **@web alias**: UI components use relative imports (`../../lib/cn`), not `@web/` alias, for workspace compatibility.
3. **Import boundaries**: Features CANNOT import from other features. Only from `components/`, `shared/`, `lib/`.
4. **Zod v4**: Schemas defined in `packages/shared/` — same validation on client and server.
5. **React 19**: Use `useWatch()` not `watch()` with React Hook Form.

## Rules

- `.claude/rules/tech-conventions.md` — TypeScript/React/Hono conventions
- `.claude/rules/parallel-dev.md` — Agent team coordination
- `.claude/rules/playwriter-xero.md` — Xero exploration safety rules

## Skills

- `/build` — Build, test, and dev server commands
- `/verify` — Browser verification for React SPA
- `/review {focus}` — Code review (code-quality, test-coverage, security)
- `/testing-conventions` — Vitest + Testing Library patterns
- `/design-spec` — Write design doc from Xero research

## Architecture

### Optimistic UI / Local-First

- Client edits are instant (React state, no server round-trip)
- Save button = sync point (POST to Hono API, server validates, confirms)
- Same Zod schemas + calc logic run on BOTH client and server
- TanStack Query handles optimistic updates and cache reconciliation

### Project Structure

```
packages/
  web/                    # Vite + React SPA (port 5174)
    src/
      components/         # ui/, layout/, patterns/
      features/           # Self-contained feature plugins
      lib/                # Client-only utilities
  api/                    # Hono API Server (port 3001)
    src/
      routes/             # One file per feature
      services/           # Business logic
      db/                 # Drizzle schema + migrations
  shared/                 # Both client and server import
    schemas/              # Zod validation schemas
    calc/                 # Tax, totals, currency calculations
    rules/                # Business rules, state machines
```

## Separation of Concerns

### Import Rules (STRICT)

```
features/{name}/ → CAN import: components/, shared/, lib/
features/{name}/ → CANNOT import: features/{other}/
components/ui/   → CANNOT import: features/, lib/
shared/          → CANNOT import: anything with React, DOM, or Node.js APIs
```

## Scripts

```bash
# Dev (both servers)
npm run dev:all

# Test (CORRECT — workspace-aware)
npm test

# Build
npm run build

# Type check
npx tsc --noEmit
```

## Design Doc

Full design document: `.claude/workflow/design/xero-replica.md`

## Project Status

See `.claude/workflow/STATUS.md` for current completion status.
