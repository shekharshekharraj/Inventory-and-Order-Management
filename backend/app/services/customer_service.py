from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CustomerService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, search: str | None = None) -> tuple[list[Customer], int]:
        query = db.query(Customer)
        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                (Customer.name.ilike(term)) | (Customer.email.ilike(term))
            )
        total = query.count()
        items = query.order_by(Customer.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, customer_id: int) -> Customer | None:
        return db.query(Customer).filter(Customer.id == customer_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Customer | None:
        return db.query(Customer).filter(Customer.email == email.strip().lower()).first()

    @staticmethod
    def create(db: Session, data: CustomerCreate) -> Customer:
        customer = Customer(**data.model_dump())
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def update(db: Session, customer: Customer, data: CustomerUpdate) -> Customer:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(customer, field, value)
        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def delete(db: Session, customer: Customer) -> None:
        db.delete(customer)
        db.commit()
