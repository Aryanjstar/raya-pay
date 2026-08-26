# AI usage

Used **Cursor Grok 4.6** (agent) to scaffold the repo, write FastAPI modules, the Next.js UI kit, seed script, and Azure deploy wiring. I directed product calls (coin cap, duplicate ids, chart filtering), reviewed every generated file, and ran seed / tests / API checks myself.

Cursor was also used to extract the assignment PDF and profile the JSON (status casing, timestamp shapes, duplicate ids, negative amounts).

## Example 1 — thrown away: pinned wheels that do not exist on Python 3.14

The agent first wrote:

```
fastapi==0.116.1
psycopg[binary]==3.2.9
pydantic==2.11.7
```

`pip` then failed with no `psycopg-binary==3.2.9` for CPython 3.14, and `pydantic-core==2.33.2` tried to build from source. That pin set was discarded. `requirements.txt` now uses lower bounds so 3.14 can resolve current wheels (`psycopg 3.3.x`, `pydantic 2.13.x`).

## Example 2 — fixed: legacy `Query` API on the wallet lock

First redeem implementation used `db.query(Wallet).filter(...).with_for_update()`, which is SQLAlchemy 1.x style and inconsistent with the rest of the codebase (`select` / `db.scalar`). Replaced with:

```python
wallet = db.scalar(select(Wallet).where(Wallet.id == WALLET_ID).with_for_update())
```

Same behaviour, one style, and it matches how `list_transactions` is written — something I would have to explain in a walkthrough.

## Example 3 — fixed: treating slash dates as month-first

An early `dateutil.parse` pass would read `12/10/2025` as 10 December (US). The file also contains unambiguous days like `21/08/2025`, so the dataset is day-first. Seed now parses `DD/MM/YYYY HH:mm:ss` explicitly before falling back to dateutil.

## Example 4 — thrown away: Node zip-deploy for the Azure frontend

First deploy attempt zipped the Next.js app and used `az webapp deploy` with `SCM_DO_BUILD_DURING_DEPLOYMENT=true`, expecting Oryx to `npm install && npm run build` on the App Service. It repeatedly stalled at Kudu's "Zipping node_modules" / build step and timed out (HTTP 504/502) on a B1 plan. Discarded in favour of building a container image with `az acr build` (using the existing `frontend/Dockerfile`) and pointing the Web App at that image — deterministic, no server-side build, and it exposed a real port-mismatch bug (a stray `PORT` app setting from the earlier attempt) that I fixed by aligning `WEBSITES_PORT` with the container's actual listening port.
