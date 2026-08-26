from fastapi import APIRouter, Depends

from app.api.deps import DbSession, TxnFilters
from app.schemas import CategorySlice, MonthlyPoint
from app.services import analytics as svc

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/by-category", response_model=list[CategorySlice])
def by_category(db: DbSession, filters: TxnFilters = Depends()) -> list[CategorySlice]:
    return svc.by_category(
        db,
        search=filters.search,
        category=None,
        status=filters.status,
        min_amount=filters.min_amount,
        max_amount=filters.max_amount,
        date_from=filters.date_from,
        date_to=filters.date_to,
    )


@router.get("/monthly", response_model=list[MonthlyPoint])
def monthly(db: DbSession, filters: TxnFilters = Depends()) -> list[MonthlyPoint]:
    return svc.monthly(
        db,
        search=filters.search,
        category=filters.category,
        status=filters.status,
        min_amount=filters.min_amount,
        max_amount=filters.max_amount,
        date_from=filters.date_from,
        date_to=filters.date_to,
    )
