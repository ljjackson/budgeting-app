# Budgeting App

Personal budgeting application with YNAB-inspired envelope budgeting. Manage accounts, import transactions via CSV, categorize spending, set category targets, and view reports.

## Tech Stack

- **Backend**: Go with Gin framework, SQLite via GORM, port 8080
- **Frontend**: React (Vite + TypeScript + TailwindCSS v4 + React Router + shadcn/ui), port 5173
- **Communication**: REST API with JSON

## Project Structure

```
backend/               Go API server
  main.go              Entry point, Gin router setup
  config/              Environment config
  models/              GORM models
  handlers/            HTTP handlers + validation
  services/            Business logic (budget, CSV import, CRUD)
  database/            SQLite connection + auto-migration + seeds
  testutil/            Test database helper
frontend/              React SPA
  src/api/client.ts    API client + types
  src/pages/           Route pages (Budget, Transactions, Accounts, Categories, Reports)
  src/components/      Reusable components (forms, tables, charts, panels)
  src/components/ui/   shadcn/ui primitives
  src/hooks/           React Query hooks
  src/utils/           Currency formatting, date helpers
sample-data/           Sample CSVs for testing import
```

## Commands

```bash
make dev            # Run both backend and frontend
make dev-backend    # Run backend only (port 8080)
make dev-frontend   # Run frontend only (port 5173)
make build          # Build both for production
make test           # Run Go tests
```

## Data Model

- **accounts**: id, name, type (checking/savings/credit/cash)
- **categories**: id, name, colour (hex)
- **transactions**: id, account_id (FK), category_id (FK nullable), amount (integer cents), description, date, type (income/expense)
- **budget_allocations**: id, month (YYYY-MM), category_id (FK), amount (integer cents) — unique on (month, category_id)
- **category_targets**: id, category_id (FK), target_type, target_amount (cents), target_date (YYYY-MM nullable), effective_from (YYYY-MM), effective_to (YYYY-MM nullable)

Amounts are stored as integer cents to avoid floating-point issues. Models do NOT use `gorm.DeletedAt` — there is no `deleted_at` column.

## API Endpoints

- `GET/POST /api/accounts`, `PUT/DELETE /api/accounts/:id`
- `GET/POST /api/categories`, `PUT/DELETE /api/categories/:id`
- `GET/POST /api/transactions`, `PUT/DELETE /api/transactions/:id`
- `PUT /api/transactions/bulk-category` — Bulk update category
- `POST /api/transactions/import` — CSV import (multipart form: file + account_id)
- `GET /api/reports/by-category` — Aggregate by category (query: date_from, date_to, type)
- `GET /api/reports/by-account` — Aggregate by account (query: date_from, date_to, type)
- `GET /api/budget` — Monthly budget view (query: month)
- `PUT /api/budget/allocate` — Set category allocation for a month
- `GET /api/budget/category-average` — 3-month spending average (query: category_id, month)
- `PUT /api/categories/:id/target` — Set/update category target (body includes month for versioning)
- `DELETE /api/categories/:id/target` — Remove category target (query: month)

## CSV Import Format

Required columns: `date`, `description`, `amount`
Optional column: `type` (income/expense — inferred from sign if omitted)

Amounts should be in decimal format (e.g. `12.50`), not cents — the importer converts to cents automatically.

## Category Targets

Three target types with underfunded calculations:

| Type | Fields | Underfunded Calculation |
|------|--------|------------------------|
| Monthly Savings | amount | `target_amount - assigned` |
| Savings Balance | amount + date | `ceil(shortfall / months_remaining) - assigned` |
| Spending by Date | amount + date | Same as savings balance |

Targets are versioned with `effective_from`/`effective_to` date ranges, so editing or removing a target preserves history — past months still show the target that was active at that time.

## Key Conventions

- `verbatimModuleSyntax` is enabled — use `import type` for type-only imports
- TailwindCSS v4 with `@tailwindcss/vite` plugin (no tailwind.config.js)
- UI components from shadcn/ui in `frontend/src/components/ui/`
- React Query for data fetching with query key structure in `frontend/src/hooks/queryKeys.ts`
