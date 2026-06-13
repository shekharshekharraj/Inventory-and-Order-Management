"""Seed the database with sample data for demo purposes."""

from decimal import Decimal

from app.core.database import Base, SessionLocal, engine
from app.models.customer import Customer
from app.models.product import Product


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Product).count() > 0:
            print("Database already seeded, skipping.")
            return

        products = [
            Product(name="Wireless Mouse", sku="WM-001", description="Ergonomic wireless mouse", price=Decimal("29.99"), stock_quantity=150),
            Product(name="Mechanical Keyboard", sku="KB-002", description="RGB mechanical keyboard", price=Decimal("89.99"), stock_quantity=75),
            Product(name="USB-C Hub", sku="HUB-003", description="7-in-1 USB-C hub", price=Decimal("49.99"), stock_quantity=8),
            Product(name="Monitor Stand", sku="MS-004", description="Adjustable monitor stand", price=Decimal("39.99"), stock_quantity=0),
            Product(name="Webcam HD", sku="WC-005", description="1080p HD webcam", price=Decimal("59.99"), stock_quantity=45),
            Product(name="Laptop Sleeve", sku="LS-006", description="13-inch laptop sleeve", price=Decimal("24.99"), stock_quantity=200),
        ]
        customers = [
            Customer(name="Alice Johnson", email="alice@example.com", phone="+1-555-0101", address="123 Main St, New York"),
            Customer(name="Bob Smith", email="bob@example.com", phone="+1-555-0102", address="456 Oak Ave, Chicago"),
            Customer(name="Carol Williams", email="carol@example.com", phone="+1-555-0103", address="789 Pine Rd, Austin"),
        ]
        db.add_all(products + customers)
        db.commit()
        print("Database seeded successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
