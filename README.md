# Raya Pay

Consumer spend and rewards dashboard for the Digital Alpha Full Stack Engineer take-home. It loads the provided ~10k card transactions into PostgreSQL, serves them through a FastAPI API, and shows a Next.js dashboard: filterable table, spend charts, coin balance, and redeem.

## Stack

- Frontend: Next.js 15, React 19, TypeScript, CSS design tokens, hand-built `Table`, Recharts
- Backend: Python, FastAPI, SQLAlchemy 2, Pydantic
- Database: PostgreSQL 16 (Docker locally)

## Live URLs

- Frontend: https://raya-web-da26.azurewebsites.net
- Backend: https://raya-api-da26.azurewebsites.net
- Health: https://raya-api-da26.azurewebsites.net/health
- API docs: https://raya-api-da26.azurewebsites.net/docs

## Local setup (under five minutes)

Prerequisites: Docker, Python 3.12+, Node 20+.

```bash
# 1. Database
docker compose up -d

# 2. Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python scripts/seed.py
uvicorn app.main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API docs: [http://localhost:8000/docs](http://localhost:8000/docs).

**Seed command (the one that matters):** from `backend/`, with Compose Postgres running:

```bash
python scripts/seed.py
```

This drops/creates tables, normalises `data/transactions.json`, seeds six rewards, and sets the wallet from earned coins.

## Done / not done / known issues

**Done**

- Server-side pagination, filter, search, sort on the full dataset
- Hand-built table (sticky header, hover, focus, loading / empty / error)
- Category and monthly charts; chart click filters the table; other filters reshape charts
- Coin balance, catalogue, redeem with confirm modal, optimistic update + rollback
- Backend rejects missing reward (404) and unaffordable redeem (409)
- PostgreSQL schema + one-command seed
- Redeem + coin-rule tests

**Not done**

- Auth / multi-user
- Bill-pay checkout (out of scope for the slice)

**Known issues**

- Source JSON has duplicate ids (~40) and mixed timestamp formats; seed keeps the first id and normalises dates. See `ASSUMPTIONS.md`.
- A few source amounts are huge (₹99,99,99,999) or negative; they stay in the table. Charts drop `|amount| >= 10 lakh` so one bad row does not flatten the rest. Negatives never earn coins.
- Redeem is not reversible from the UI.

## Docs

- [ASSUMPTIONS.md](ASSUMPTIONS.md)
- [DECISIONS.md](DECISIONS.md)
- [AI-USAGE.md](AI-USAGE.md)
