from datetime import datetime
from decimal import Decimal

from app.services import coins_for_amount


def test_coins_cap_and_rules():
    assert coins_for_amount(Decimal("99.99"), "SUCCESS") == 0
    assert coins_for_amount(Decimal("100.00"), "SUCCESS") == 1
    assert coins_for_amount(Decimal("9999.00"), "SUCCESS") == 50
    assert coins_for_amount(Decimal("500.00"), "FAILED") == 0
    assert coins_for_amount(Decimal("-200.00"), "SUCCESS") == 0
