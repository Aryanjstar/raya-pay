from datetime import datetime
from decimal import Decimal
from math import ceil

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models import Transaction
from app.schemas import SortDir, SortField, TransactionListOut, TransactionOut


def apply_filters(
    stmt: Select,
    *,
    search: str | None,
    category: str | None,
    status: str | None,
    min_amount: Decimal | None,
    max_amount: Decimal | None,
    date_from: datetime | None,
    date_to: datetime | None,
) -> Select:
    if search:
        stmt = stmt.where(Transaction.merchant.ilike(f"%{search.strip()}%"))
    if category:
        stmt = stmt.where(Transaction.category == category)
    if status:
        stmt = stmt.where(Transaction.status == status)
    if min_amount is not None:
        stmt = stmt.where(Transaction.amount >= min_amount)
    if max_amount is not None:
        stmt = stmt.where(Transaction.amount <= max_amount)
    if date_from is not None:
        stmt = stmt.where(Transaction.occurred_at >= date_from)
    if date_to is not None:
        stmt = stmt.where(Transaction.occurred_at <= date_to)
    return stmt


def list_transactions(
    db: Session,
    *,
    page: int,
    page_size: int,
    search: str | None,
    category: str | None,
    status: str | None,
    min_amount: Decimal | None,
    max_amount: Decimal | None,
    date_from: datetime | None,
    date_to: datetime | None,
    sort: SortField,
    direction: SortDir,
) -> TransactionListOut:
    filters = dict(
        search=search,
        category=category,
        status=status,
        min_amount=min_amount,
        max_amount=max_amount,
        date_from=date_from,
        date_to=date_to,
    )
    count_stmt = apply_filters(select(func.count(Transaction.id)), **filters)
    total = int(db.scalar(count_stmt) or 0)

    sort_col = Transaction.occurred_at if sort == "occurred_at" else Transaction.amount
    order = sort_col.asc() if direction == "asc" else sort_col.desc()
    # stable secondary sort so pagination doesn't jitter
    stmt = apply_filters(select(Transaction), **filters).order_by(order, Transaction.id.asc())
    offset = (page - 1) * page_size
    rows = db.scalars(stmt.offset(offset).limit(page_size)).all()
    pages = ceil(total / page_size) if page_size else 0
    return TransactionListOut(
        items=[TransactionOut.model_validate(r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


def get_transaction(db: Session, txn_id: str) -> Transaction | None:
    return db.get(Transaction, txn_id)


def list_categories(db: Session) -> list[str]:
    rows = db.scalars(select(Transaction.category).distinct().order_by(Transaction.category)).all()
    return list(rows)
