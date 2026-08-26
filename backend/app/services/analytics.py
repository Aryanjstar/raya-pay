from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Transaction
from app.schemas import CategorySlice, MonthlyPoint
from app.services.transactions import apply_filters


def by_category(
    db: Session,
    *,
    search: str | None,
    category: str | None,
    status: str | None,
    min_amount: Decimal | None,
    max_amount: Decimal | None,
    date_from: datetime | None,
    date_to: datetime | None,
) -> list[CategorySlice]:
    stmt = apply_filters(
        select(
            Transaction.category,
            func.coalesce(func.sum(Transaction.amount), 0),
            func.count(Transaction.id),
        ),
        search=search,
        category=category,
        status=status,
        min_amount=min_amount,
        max_amount=max_amount,
        date_from=date_from,
        date_to=date_to,
    ).where(func.abs(Transaction.amount) < 1_000_000).group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc())
    rows = db.execute(stmt).all()
    return [CategorySlice(category=r[0], total=r[1], count=r[2]) for r in rows]


def monthly(
    db: Session,
    *,
    search: str | None,
    category: str | None,
    status: str | None,
    min_amount: Decimal | None,
    max_amount: Decimal | None,
    date_from: datetime | None,
    date_to: datetime | None,
) -> list[MonthlyPoint]:
    month_expr = func.to_char(func.timezone("UTC", Transaction.occurred_at), "YYYY-MM")
    stmt = apply_filters(
        select(
            month_expr,
            func.coalesce(func.sum(Transaction.amount), 0),
            func.count(Transaction.id),
        ),
        search=search,
        category=category,
        status=status,
        min_amount=min_amount,
        max_amount=max_amount,
        date_from=date_from,
        date_to=date_to,
    ).where(func.abs(Transaction.amount) < 1_000_000).group_by(month_expr).order_by(month_expr)
    rows = db.execute(stmt).all()
    return [MonthlyPoint(month=r[0], total=r[1], count=r[2]) for r in rows]
