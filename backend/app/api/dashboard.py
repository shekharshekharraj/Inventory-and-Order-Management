from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.dashboard import DashboardStats, InventoryAlert
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return DashboardService.get_stats(db)


@router.get("/inventory-alerts", response_model=list[InventoryAlert])
def get_inventory_alerts(
    threshold: int = Query(10, ge=0),
    db: Session = Depends(get_db),
):
    return DashboardService.get_inventory_alerts(db, threshold=threshold)
