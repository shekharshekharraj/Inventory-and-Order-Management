# Submission Details — Ethara AI Assessment

Fill in your URLs after deployment and include this in your submission email.

## GitHub Repository
https://github.com/YOUR_USERNAME/inventory-management

## Live Application URLs

| Service | URL |
|---------|-----|
| Frontend (Live App) | https://YOUR-PROJECT.vercel.app |
| Backend API | https://inventory-api.onrender.com |
| API Documentation | https://inventory-api.onrender.com/docs |
| Health Check | https://inventory-api.onrender.com/health |

## Docker Hub Images

| Image | URL |
|-------|-----|
| Backend | https://hub.docker.com/r/YOUR_USERNAME/inventory-backend |
| Frontend | https://hub.docker.com/r/YOUR_USERNAME/inventory-frontend |

## Quick Verification Commands

```bash
# Health check
curl https://inventory-api.onrender.com/health

# List products
curl https://inventory-api.onrender.com/api/v1/products

# Test insufficient stock (should return 400)
curl -X POST https://inventory-api.onrender.com/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"customer_id": 1, "items": [{"product_id": 4, "quantity": 1}]}'
```

## Business Rules Demonstrated

- [x] Unique product SKUs (409 Conflict on duplicate)
- [x] Unique customer emails (409 Conflict on duplicate)
- [x] Inventory validation before order creation
- [x] Automatic stock reduction on order placement
- [x] Stock restoration on order cancellation
- [x] Low stock / out of stock dashboard alerts

## Architecture Highlights

- Clean service-layer architecture (separation of concerns)
- Full test suite (7 API tests covering all business rules)
- Docker Compose one-command startup
- GitHub Actions CI pipeline
- Interactive Swagger API documentation
- Responsive React dashboard with real-time inventory alerts
