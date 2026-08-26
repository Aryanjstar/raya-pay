from decimal import Decimal

from app.config import settings


def coins_for_amount(amount: Decimal, status: str) -> int:
    if status != "SUCCESS":
        return 0
    if amount <= 0:
        return 0
    earned = int(amount // 100)
    return min(earned, settings.coin_cap_per_txn)
