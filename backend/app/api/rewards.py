from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas import RedeemIn, RedeemOut, RewardOut, WalletOut
from app.services import rewards as svc

router = APIRouter(tags=["rewards"])


@router.get("/rewards", response_model=list[RewardOut])
def list_rewards(db: DbSession) -> list[RewardOut]:
    return svc.list_rewards(db)


@router.get("/wallet", response_model=WalletOut)
def wallet(db: DbSession) -> WalletOut:
    return svc.get_wallet(db)


@router.post("/redeem", response_model=RedeemOut)
def redeem(body: RedeemIn, db: DbSession) -> RedeemOut:
    return svc.redeem(db, body.reward_id)
