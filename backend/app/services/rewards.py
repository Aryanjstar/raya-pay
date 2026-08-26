from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Redemption, Reward, Wallet
from app.schemas import RedeemOut, RewardOut, WalletOut

WALLET_ID = 1


def list_rewards(db: Session) -> list[RewardOut]:
    rows = db.scalars(select(Reward).where(Reward.active.is_(True)).order_by(Reward.coin_cost)).all()
    return [RewardOut.model_validate(r) for r in rows]


def get_wallet(db: Session) -> WalletOut:
    wallet = db.get(Wallet, WALLET_ID)
    if wallet is None:
        raise HTTPException(status_code=500, detail="Wallet is not initialised")
    return WalletOut(balance=wallet.balance)


def redeem(db: Session, reward_id: str) -> RedeemOut:
    reward = db.get(Reward, reward_id)
    if reward is None or not reward.active:
        raise HTTPException(
            status_code=404,
            detail={"detail": "Reward not found", "code": "reward_not_found"},
        )

    wallet = db.scalar(select(Wallet).where(Wallet.id == WALLET_ID).with_for_update())
    if wallet is None:
        raise HTTPException(status_code=500, detail="Wallet is not initialised")

    if wallet.balance < reward.coin_cost:
        raise HTTPException(
            status_code=409,
            detail={"detail": "Not enough coins", "code": "insufficient_balance"},
        )

    wallet.balance -= reward.coin_cost
    redemption = Redemption(reward_id=reward.id, coins_spent=reward.coin_cost)
    db.add(redemption)
    db.commit()
    db.refresh(redemption)
    db.refresh(wallet)
    return RedeemOut(
        redemption_id=redemption.id,
        reward_id=reward.id,
        coins_spent=reward.coin_cost,
        balance=wallet.balance,
    )
