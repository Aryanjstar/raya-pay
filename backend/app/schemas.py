from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class TransactionOut(BaseModel):
    id: str
    occurred_at: datetime
    merchant: str
    category: str
    amount: Decimal
    currency: str
    status: str
    payment_method: str
    coins_earned: int

    model_config = {"from_attributes": True}


class TransactionListOut(BaseModel):
    items: list[TransactionOut]
    total: int
    page: int
    page_size: int
    pages: int


class CategorySlice(BaseModel):
    category: str
    total: Decimal
    count: int


class MonthlyPoint(BaseModel):
    month: str
    total: Decimal
    count: int


class RewardOut(BaseModel):
    id: str
    name: str
    description: str
    coin_cost: int
    active: bool

    model_config = {"from_attributes": True}


class WalletOut(BaseModel):
    balance: int


class RedeemIn(BaseModel):
    reward_id: str = Field(min_length=1)


class RedeemOut(BaseModel):
    redemption_id: int
    reward_id: str
    coins_spent: int
    balance: int


class ErrorOut(BaseModel):
    detail: str
    code: str


SortField = Literal["occurred_at", "amount"]
SortDir = Literal["asc", "desc"]
StatusFilter = Literal["SUCCESS", "FAILED", "PENDING"]
