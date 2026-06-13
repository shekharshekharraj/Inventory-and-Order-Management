from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderItemResponse, OrderResponse
from app.services.customer_service import CustomerService
from app.services.product_service import ProductService


class InsufficientStockError(Exception):
    def __init__(self, product_name: str, requested: int, available: int):
        self.product_name = product_name
        self.requested = requested
        self.available = available
        super().__init__(
            f"Insufficient stock for '{product_name}': requested {requested}, available {available}"
        )


class OrderService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> tuple[list[Order], int]:
        query = db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.customer),
        )
        total = query.count()
        items = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, order_id: int) -> Order | None:
        return (
            db.query(Order)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product),
                joinedload(Order.customer),
            )
            .filter(Order.id == order_id)
            .first()
        )

    @staticmethod
    def create(db: Session, data: OrderCreate) -> Order:
        customer = CustomerService.get_by_id(db, data.customer_id)
        if not customer:
            raise ValueError(f"Customer with id {data.customer_id} not found")

        product_ids = [item.product_id for item in data.items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Duplicate products in order are not allowed")

        products: dict[int, Product] = {}
        for item in data.items:
            product = ProductService.get_by_id(db, item.product_id)
            if not product:
                raise ValueError(f"Product with id {item.product_id} not found")
            if product.stock_quantity < item.quantity:
                raise InsufficientStockError(product.name, item.quantity, product.stock_quantity)
            products[item.product_id] = product

        order = Order(
            customer_id=data.customer_id,
            status=OrderStatus.CONFIRMED.value,
            notes=data.notes,
            total_amount=Decimal("0"),
        )
        db.add(order)
        db.flush()

        total_amount = Decimal("0")
        for item in data.items:
            product = products[item.product_id]
            subtotal = product.price * item.quantity
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price,
                subtotal=subtotal,
            )
            product.stock_quantity -= item.quantity
            total_amount += subtotal
            db.add(order_item)

        order.total_amount = total_amount
        db.commit()
        db.refresh(order)
        return OrderService.get_by_id(db, order.id)  # type: ignore[return-value]

    @staticmethod
    def update_status(db: Session, order: Order, status: OrderStatus) -> Order:
        if order.status == OrderStatus.CANCELLED.value:
            raise ValueError("Cannot update a cancelled order")
        if status == OrderStatus.CANCELLED and order.status != OrderStatus.CANCELLED.value:
            for item in order.items:
                product = ProductService.get_by_id(db, item.product_id)
                if product:
                    product.stock_quantity += item.quantity
        order.status = status.value
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def to_response(order: Order) -> OrderResponse:
        items = [
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=item.subtotal,
                product_name=item.product.name if item.product else None,
                product_sku=item.product.sku if item.product else None,
            )
            for item in order.items
        ]
        return OrderResponse(
            id=order.id,
            customer_id=order.customer_id,
            status=OrderStatus(order.status),
            total_amount=order.total_amount,
            notes=order.notes,
            created_at=order.created_at,
            updated_at=order.updated_at,
            customer_name=order.customer.name if order.customer else None,
            items=items,
        )
