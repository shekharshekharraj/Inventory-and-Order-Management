import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import create_app

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def client():
    Base.metadata.create_all(bind=engine)
    test_app = create_app(init_db=False)
    test_app.dependency_overrides[get_db] = override_get_db
    with TestClient(test_app) as test_client:
        yield test_client
    test_app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_product(client):
    response = client.post(
        "/api/v1/products",
        json={"name": "Test Product", "sku": "TEST-001", "price": "19.99", "stock_quantity": 100},
    )
    assert response.status_code == 201
    assert response.json()["sku"] == "TEST-001"


def test_duplicate_sku_rejected(client):
    payload = {"name": "Product A", "sku": "DUP-001", "price": "10.00", "stock_quantity": 50}
    client.post("/api/v1/products", json=payload)
    response = client.post("/api/v1/products", json={**payload, "name": "Product B"})
    assert response.status_code == 409


def test_duplicate_email_rejected(client):
    payload = {"name": "John Doe", "email": "john@example.com"}
    client.post("/api/v1/customers", json=payload)
    response = client.post("/api/v1/customers", json={**payload, "name": "Jane Doe"})
    assert response.status_code == 409


def test_order_reduces_stock(client):
    product = client.post(
        "/api/v1/products",
        json={"name": "Stock Test", "sku": "ST-001", "price": "5.00", "stock_quantity": 10},
    ).json()
    customer = client.post(
        "/api/v1/customers",
        json={"name": "Buyer", "email": "buyer@example.com"},
    ).json()

    order_response = client.post(
        "/api/v1/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "quantity": 3}]},
    )
    assert order_response.status_code == 201

    updated_product = client.get(f"/api/v1/products/{product['id']}").json()
    assert updated_product["stock_quantity"] == 7


def test_insufficient_stock_rejected(client):
    product = client.post(
        "/api/v1/products",
        json={"name": "Low Stock", "sku": "LS-001", "price": "5.00", "stock_quantity": 2},
    ).json()
    customer = client.post(
        "/api/v1/customers",
        json={"name": "Buyer 2", "email": "buyer2@example.com"},
    ).json()

    response = client.post(
        "/api/v1/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "quantity": 5}]},
    )
    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]["message"]


def test_dashboard_stats(client):
    client.post(
        "/api/v1/products",
        json={"name": "Dash Product", "sku": "DASH-001", "price": "15.00", "stock_quantity": 5},
    )
    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    assert response.json()["total_products"] >= 1
