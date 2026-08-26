from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import DbSession, TxnFilters
from app.schemas import TransactionListOut, TransactionOut
from app.services import transactions as svc

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=TransactionListOut)
def list_transactions(db: DbSession, filters: TxnFilters = Depends()) -> TransactionListOut:
    return svc.list_transactions(
        db,
        page=filters.page,
        page_size=filters.page_size,
        search=filters.search,
        category=filters.category,
        status=filters.status,
        min_amount=filters.min_amount,
        max_amount=filters.max_amount,
        date_from=filters.date_from,
        date_to=filters.date_to,
        sort=filters.sort,
        direction=filters.direction,
    )


@router.get("/categories", response_model=list[str])
def categories(db: DbSession) -> list[str]:
    return svc.list_categories(db)


@router.get("/{txn_id}", response_model=TransactionOut)
def get_transaction(txn_id: str, db: DbSession) -> TransactionOut:
    row = svc.get_transaction(db, txn_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionOut.model_validate(row)
