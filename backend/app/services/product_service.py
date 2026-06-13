from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, search: str | None = None) -> tuple[list[Product], int]:
        query = db.query(Product)
        if search:
            term = f"%{search.strip()}%"
            query = query.filter((Product.name.ilike(term)) | (Product.sku.ilike(term)))
        total = query.count()
        items = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Product | None:
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    def get_by_sku(db: Session, sku: str) -> Product | None:
        return db.query(Product).filter(Product.sku == sku.strip().upper()).first()

    @staticmethod
    def create(db: Session, data: ProductCreate) -> Product:
        product = Product(**data.model_dump())
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def update(db: Session, product: Product, data: ProductUpdate) -> Product:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def delete(db: Session, product: Product) -> None:
        db.delete(product)
        db.commit()

    @staticmethod
    def get_low_stock(db: Session, threshold: int = 10) -> list[Product]:
        return (
            db.query(Product)
            .filter(Product.stock_quantity <= threshold)
            .order_by(Product.stock_quantity.asc())
            .all()
        )
