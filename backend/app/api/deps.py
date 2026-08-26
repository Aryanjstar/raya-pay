from datetime import datetime
from decimal import Decimal
from typing import Annotated

from fastapi import Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import SortDir, SortField

DbSession = Annotated[Session, Depends(get_db)]


class TxnFilters:
    def __init__(
        self,
        search: str | None = Query(None, description="Merchant name contains"),
        category: str | None = Query(None),
        status: str | None = Query(None, pattern="^(SUCCESS|FAILED|PENDING)$"),
        min_amount: Decimal | None = Query(None),
        max_amount: Decimal | None = Query(None),
        date_from: datetime | None = Query(None),
        date_to: datetime | None = Query(None),
        sort: SortField = Query("occurred_at"),
        direction: SortDir = Query("desc"),
        page: int = Query(1, ge=1),
        page_size: int = Query(25, ge=1, le=100),
    ) -> None:
        self.search = search
        self.category = category
        self.status = status
        self.min_amount = min_amount
        self.max_amount = max_amount
        self.date_from = date_from
        self.date_to = date_to
        self.sort = sort
        self.direction = direction
        self.page = page
        self.page_size = page_size
