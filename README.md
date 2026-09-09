# Qasim Inventory

A stock, sales, expense, cash & purchase management system — built to replace informal register-book tracking with a proper, auditable ledger.

**Stack:** FastAPI (Python) backend · React + TypeScript frontend · PostgreSQL database (`qasim_inventory`)

---

## What it does

- **Items & Stock** — dynamic item list (add new items anytime), record sales by quantity only (no pricing), remaining stock is always auto-calculated from a full movement history (never a mutable counter that can drift).
- **Sales Ledger** — quantity-only sale entries per item, with automatic stock deduction and validation (can't oversell).
- **Daily Expenses** — log multiple small expense entries per day, auto-totaled.
- **Cash Book** — enter opening cash per day; closing balance (`opening − expenses`) is always derived live, never stored stale.
- **Purchases / Carton Entries** — enter total amount + rate per unit; quantity is always calculated (`amount ÷ rate`), optionally linked to an item to auto-increase its stock.
- **Dashboard** — at-a-glance totals, low-stock alerts, today's cash position.

Every one of these matches the exact worked examples from the original requirement (20 stock − 5 sold = 15 remaining; Rs. 200,000 − Rs. 1,350 = Rs. 198,650; Rs. 20,000 ÷ Rs. 15 = quantity) — and is covered by automated tests.

---

## Project structure

```
qasim_inventory/
├── backend/                   # FastAPI application
│   ├── app/
│   │   ├── core/               # config, database session, security (JWT/bcrypt)
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── api/routes/            # route handlers (auth, items, sales, expenses, cash, purchases, dashboard)
│   │   ├── services/               # business logic (stock calculations)
│   │   └── constants.py             # enums & fixed values (mirrored in frontend)
│   ├── alembic/                # database migrations
│   ├── tests/                  # pytest suite (16 tests, isolated SQLite per test)
│   └── Dockerfile
├── frontend/                  # React + TypeScript (Vite)
│   ├── src/
│   │   ├── types/               # global TypeScript types (mirrors backend schemas)
│   │   ├── constants/             # global constants (mirrors backend constants.py)
│   │   ├── api/                     # typed API client modules
│   │   ├── components/common/        # Button, Input, Select, Card, Table, Modal, Badge, Loader, EmptyState
│   │   ├── components/layout/         # Sidebar, Header, DashboardLayout, ProtectedRoute
│   │   ├── context/                    # AuthContext
│   │   ├── pages/                       # Dashboard, Items, Sales, Expenses, Cash, Purchases, Auth
│   │   └── utils/                        # formatting helpers
│   └── Dockerfile
└── docker-compose.yml         # postgres + backend + frontend, one command
```

---

## Quick start (Docker — recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API docs (Swagger): http://localhost:8000/docs
- Postgres runs internally as database `qasim_inventory`

On first run, register a user via the API docs (`POST /api/v1/auth/register`) or add a simple signup flow later — there's no seeded user by default for security.

---

## Manual setup (without Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # edit DATABASE_URL & SECRET_KEY
alembic upgrade head                                    # create tables via migration
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`, interactive docs at `/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env      # set VITE_API_BASE_URL if backend isn't on localhost:8000
npm run dev
```

App available at `http://localhost:5173`.

---

## Running tests

**Backend** (16 tests — auth, stock math, expenses/cash, purchases):

```bash
cd backend
pytest
```

**Frontend** (formatting & utility unit tests, extend with component tests as pages grow):

```bash
cd frontend
npm run test
```

---

## Security notes

- Passwords hashed with bcrypt, never stored or logged in plaintext.
- JWT access + refresh tokens; access tokens expire in 60 minutes by default (`ACCESS_TOKEN_EXPIRE_MINUTES`).
- Role-based access (`ADMIN` / `STAFF`) is in place at the model level — extend `require_admin` dependency onto any route that should be admin-only (e.g. deleting items).
- **Before going to production:** change `SECRET_KEY` in `.env` to a long random value, restrict `CORS_ORIGINS` to your real frontend domain, and put the API behind HTTPS.
- All database writes go through Pydantic validation — no raw SQL, no injection surface.

---

## Database migrations (Alembic)

Schema changes should go through Alembic rather than relying on `create_all` in production:

```bash
cd backend
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

The initial schema migration (`alembic/versions/0001_initial_schema.py`) already covers all 6 tables: `users`, `items`, `stock_movements`, `sale_entries`, `expense_entries`, `cash_book`, `purchase_entries`.

---

## Extending this further

Ideas that fit naturally into the existing architecture:

- PDF/Excel export of daily or monthly reports (item stock, expenses, cash book)
- Push/SMS alert when an item crosses its low-stock threshold
- Multi-user activity log (who made which entry — `created_by_id` is already tracked on every table)
- Barcode/QR support on item codes for faster sale entry
