"""Create schema and load transactions.json in one command.

Usage (from backend/):
    python scripts/seed.py
"""

from __future__ import annotations

import json
import sys
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

from dateutil import parser as date_parser
from sqlalchemy import func, select, text

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.db import Base, SessionLocal, engine  # noqa: E402
from app.models import Redemption, Reward, Transaction, Wallet  # noqa: E402
from app.services import coins_for_amount  # noqa: E402

DATA_PATH = ROOT / "data" / "transactions.json"

CATALOGUE = [
    {
        "id": "amazon-500",
        "name": "Amazon ₹500 voucher",
        "description": "Gift card for Amazon.in. Lands in your email in a few minutes.",
        "coin_cost": 500,
    },
    {
        "id": "swiggy-200",
        "name": "Swiggy ₹200",
        "description": "Take the edge off the next food order.",
        "coin_cost": 200,
    },
    {
        "id": "flipkart-300",
        "name": "Flipkart ₹300 voucher",
        "description": "Shop electronics, home, and more.",
        "coin_cost": 300,
    },
    {
        "id": "cashback-100",
        "name": "₹100 statement credit",
        "description": "Applied to your next card bill.",
        "coin_cost": 100,
    },
    {
        "id": "bookmyshow-250",
        "name": "BookMyShow ₹250",
        "description": "Movie night, on us.",
        "coin_cost": 250,
    },
    {
        "id": "airtel-150",
        "name": "Airtel prepaid ₹150",
        "description": "Recharge any Airtel prepaid number.",
        "coin_cost": 150,
    },
]


def parse_timestamp(value: object) -> datetime:
    if isinstance(value, (int, float)):
        ts = float(value)
        if ts > 1e12:
            ts /= 1000.0
        return datetime.fromtimestamp(ts, tz=UTC)
    raw = str(value).strip()
    # DD/MM/YYYY HH:mm:ss — day-first, common in this dataset
    if "/" in raw and raw[0].isdigit():
        try:
            dt = datetime.strptime(raw, "%d/%m/%Y %H:%M:%S")
            return dt.replace(tzinfo=UTC)
        except ValueError:
            pass
    dt = date_parser.parse(raw)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def parse_amount(value: object) -> Decimal:
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"bad amount: {value!r}") from exc


def normalize_status(value: object) -> str:
    s = str(value or "").strip().upper()
    if s in {"SUCCESS", "FAILED", "PENDING"}:
        return s
    return "PENDING"


def normalize_category(value: object) -> str:
    s = str(value or "").strip()
    return s if s else "Uncategorized"


def load_json() -> list[dict]:
    if not DATA_PATH.exists():
        raise SystemExit(f"Missing dataset at {DATA_PATH}")
    with DATA_PATH.open() as fh:
        return json.load(fh)


def reset_schema() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed_transactions(db) -> tuple[int, int, int]:
    rows = load_json()
    seen: set[str] = set()
    inserted = 0
    skipped_dupes = 0
    skipped_bad = 0
    batch: list[Transaction] = []

    for raw in rows:
        txn_id = str(raw.get("id") or "").strip()
        if not txn_id:
            skipped_bad += 1
            continue
        if txn_id in seen:
            skipped_dupes += 1
            continue
        seen.add(txn_id)
        try:
            amount = parse_amount(raw.get("amount"))
            status = normalize_status(raw.get("status"))
            txn = Transaction(
                id=txn_id,
                occurred_at=parse_timestamp(raw.get("timestamp")),
                merchant=str(raw.get("merchant") or "").strip() or "Unknown",
                category=normalize_category(raw.get("category")),
                amount=amount,
                currency=str(raw.get("currency") or "INR"),
                status=status,
                payment_method=str(raw.get("payment_method") or "Unknown"),
                coins_earned=coins_for_amount(amount, status),
            )
        except (ValueError, TypeError, OverflowError):
            skipped_bad += 1
            continue
        batch.append(txn)
        if len(batch) >= 500:
            db.add_all(batch)
            db.flush()
            batch.clear()
        inserted += 1

    if batch:
        db.add_all(batch)
        db.flush()
    return inserted, skipped_dupes, skipped_bad


def seed_rewards(db) -> None:
    for item in CATALOGUE:
        db.add(Reward(**item, active=True))


def seed_wallet(db) -> int:
    total_coins = db.scalar(select(func.coalesce(func.sum(Transaction.coins_earned), 0))) or 0
    db.add(Wallet(id=1, balance=int(total_coins)))
    return int(total_coins)


def main() -> None:
    print("Resetting schema…")
    reset_schema()
    db = SessionLocal()
    try:
        inserted, dupes, bad = seed_transactions(db)
        seed_rewards(db)
        balance = seed_wallet(db)
        db.commit()
        print(f"Transactions inserted: {inserted}")
        print(f"Duplicate ids skipped: {dupes}")
        print(f"Malformed rows skipped: {bad}")
        print(f"Wallet balance: {balance} coins")
        counts = db.execute(text("SELECT status, count(*) FROM transactions GROUP BY status")).all()
        print("Status counts:", {row[0]: row[1] for row in counts})
        _ = Redemption  # keep import used for metadata
    finally:
        db.close()
    print("Seed complete.")


if __name__ == "__main__":
    main()
