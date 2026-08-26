from datetime import UTC, datetime
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models import Reward, Transaction, Wallet


def setup_client():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    db = TestingSession()
    db.add(
        Transaction(
            id="TXN1",
            occurred_at=datetime(2026, 1, 1, tzinfo=UTC),
            merchant="Test",
            category="Shopping",
            amount=Decimal("1000.00"),
            currency="INR",
            status="SUCCESS",
            payment_method="UPI",
            coins_earned=10,
        )
    )
    db.add(Reward(id="cheap", name="Cheap", description="d", coin_cost=5, active=True))
    db.add(Reward(id="pricey", name="Pricey", description="d", coin_cost=9999, active=True))
    db.add(Wallet(id=1, balance=10))
    db.commit()
    db.close()
    return TestClient(app)


def test_redeem_success_and_insufficient():
    client = setup_client()
    ok = client.post("/redeem", json={"reward_id": "cheap"})
    assert ok.status_code == 200
    assert ok.json()["balance"] == 5

    poor = client.post("/redeem", json={"reward_id": "pricey"})
    assert poor.status_code == 409
    assert poor.json()["detail"]["code"] == "insufficient_balance"

    missing = client.post("/redeem", json={"reward_id": "nope"})
    assert missing.status_code == 404

    bad = client.post("/redeem", json={})
    assert bad.status_code == 400
