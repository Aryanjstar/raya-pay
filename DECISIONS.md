# Decisions

Technical choices that mattered.

## Server-side pagination over virtualizing 10k rows

The brief allows either. Filtering, sorting, and paging in PostgreSQL is what we would ship internally: the browser never holds 10k rows, first paint stays light, and the API is honest about `total` / `pages`. Virtualization would still need a fat download and would fight with combinable filters. Page size is 25.

## Hand-built table, not a grid library

Required. Sticky header, keyboard-activatable rows, loading / empty / error inside the table, CSS modules. No MUI / Ant / Chakra / shadcn on the table.

## Design tokens + four primitives

`--bg`, spacing scale, type, radii live in `frontend/app/globals.css`. Reused `Button`, `Card`, `Modal`, `Table`. Modal is hand-built (focus trap, Escape, restore focus) because the brief treats that as a positive signal.

## FastAPI layering

Routes in `app/api`, query/redeem logic in `app/services`, ORM in `app/models`. Keeps the redeem lock and HTTP status mapping out of the router.

## Schema (not JSON-in-a-column)

`transactions` is a real table with indexes on `occurred_at`, `merchant`, `category`, `status`. Rewards and redemptions are separate. Wallet is a single locked row so two redeem requests cannot overspend.

## SQLAlchemy 2 + psycopg 3

Current default Postgres driver stack. Seed uses `drop_all` / `create_all` so one command is enough; no Alembic for a 24-hour assignment.

## TanStack Query

Server state (list, charts, wallet) with a cache key per filter set. Redeem uses `onMutate` / `onError` for optimistic balance and rollback.

## Recharts

Allowed by the brief. Pie + bar, click handlers wired to the same filter state the table uses.

## Docker Compose for local Postgres 16

Matches “one documented command” plus a real engine. Azure uses Flexible Server 16 in production.

## Next.js App Router, client dashboard

The page is a client-heavy dashboard talking to FastAPI. No Next API routes, so the backend stays the source of truth and is independently deployable.

## Azure deploy shape

- Backend: Azure App Service (Linux, Python 3.12), deployed as a zip via `az webapp deploy` — no container needed since Oryx's Python build is fast and reliable.
- Frontend: Azure App Service (Linux, container) running the image built by `az acr build` from `frontend/Dockerfile` (multi-stage, Next.js standalone output). We moved off the Node zip-deploy path after Kudu's Node build step repeatedly stalled/timed out on a B1 plan; a prebuilt container starts deterministically instead.
- Database: Azure Database for PostgreSQL Flexible Server 16, Burstable B1ms, seeded with the same `scripts/seed.py` used locally.
- `infra/deploy.sh` documents the exact `az` commands for reproducing this.
