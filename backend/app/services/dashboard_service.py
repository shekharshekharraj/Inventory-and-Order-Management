from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product
from app.schemas.dashboard import DashboardStats, InventoryAlert
from app.services.product_service import ProductService


class DashboardService:
    @staticmethod
    def get_stats(db: Session) -> DashboardStats:
        total_products = db.query(func.count(Product.id)).scalar() or 0
        total_customers = db.query(func.count(Customer.id)).scalar() or 0
        total_orders = db.query(func.count(Order.id)).scalar() or 0
        total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0)).scalar() or Decimal("0")
        low_stock = (
            db.query(func.count(Product.id))
            .filter(Product.stock_quantity > 0, Product.stock_quantity <= 10)
            .scalar()
            or 0
        )
        out_of_stock = (
            db.query(func.count(Product.id)).filter(Product.stock_quantity == 0).scalar() or 0
        )
        return DashboardStats(
            total_products=total_products,
            total_customers=total_customers,
            total_orders=total_orders,
            total_revenue=Decimal(str(total_revenue)),
            low_stock_products=low_stock,
            out_of_stock_products=out_of_stock,
        )

    @staticmethod
    def get_inventory_alerts(db: Session, threshold: int = 10) -> list[InventoryAlert]:
        products = ProductService.get_low_stock(db, threshold)
        alerts = []
        for product in products:
            status = "out_of_stock" if product.stock_quantity == 0 else "low_stock"
            alerts.append(
                InventoryAlert(
                    product_id=product.id,
                    product_name=product.name,
                    sku=product.sku,
                    stock_quantity=product.stock_quantity,
                    status=status,
                )
            )
        return alerts
