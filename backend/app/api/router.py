from fastapi import APIRouter

from app.api import customers, dashboard, orders, products

api_router = APIRouter()
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
