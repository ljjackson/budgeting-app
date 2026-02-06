# Budgeting App

Personal budgeting application for viewing transactions, categorizing them, seeing report breakdowns, and managing accounts.

## Tech Stack

- **Backend**: Go with Gin framework, SQLite via GORM, port 8080
- **Frontend**: React (Vite + TypeScript + TailwindCSS + React Router), port 5173
- **Communication**: REST API with JSON

## Project Structure

```
backend/           Go API server
  main.go          Entry point, Gin router setup
  models/          GORM models (account, category, transaction)
  handlers/        HTTP handlers (accounts, categories, transactions, reports)
  database/        SQLite connection + auto-migration
  services/        CSV parsing logic
frontend/          React SPA
  src/api/         API client module
  src/pages/       Route pages (Transactions, Accounts, Categories, Reports)
  src/components/  Reusable components (forms, tables, charts, CSV import)
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

Amounts are stored as integer cents to avoid floating-point issues.

## API Endpoints

- `GET/POST /api/accounts`, `PUT/DELETE /api/accounts/:id`
- `GET/POST /api/categories`, `PUT/DELETE /api/categories/:id`
- `GET/POST /api/transactions`, `PUT/DELETE /api/transactions/:id`
- `POST /api/transactions/import` — CSV import (multipart form: file + account_id)
- `GET /api/reports/by-category` — Aggregate by category (query: date_from, date_to, type)
- `GET /api/reports/by-account` — Aggregate by account (query: date_from, date_to, type)

## CSV Import Format

Required columns: `date`, `description`, `amount`
Optional column: `type` (income/expense — inferred from sign if omitted)
