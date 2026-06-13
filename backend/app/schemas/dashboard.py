from decimal import Decimal

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: Decimal
    low_stock_products: int
    out_of_stock_products: int


class InventoryAlert(BaseModel):
    product_id: int
    product_name: str
    sku: str
    stock_quantity: int
    status: str
