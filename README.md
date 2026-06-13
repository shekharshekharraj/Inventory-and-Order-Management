# Inventory & Order Management System

> A production-grade full-stack application for managing products, customers, orders, and real-time inventory tracking.

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (Live App) | _Add your Vercel URL here_ |
| Backend REST API | _Add your Render URL here_ |
| Interactive API Docs | `{BACKEND_URL}/docs` |
| Health Check | `{BACKEND_URL}/health` |

---

## About This Project

This system was designed and built with the same standards I apply in professional engineering work — clean separation of concerns, validated business rules, defensive error handling, and a UI that is accessible and responsive out of the box.

The architecture reflects patterns I have used in production: a service layer that keeps route handlers thin, Pydantic schemas that prevent bad data from ever reaching the database, and atomic database operations to ensure inventory counts stay consistent under concurrent load.

### What makes this stand out

- **Layered architecture** — API routes, service layer, and data models are fully decoupled, making the codebase easy to test, extend, and hand off to a team
- **Strict business rules** — SKU uniqueness, email uniqueness, stock validation, and atomic stock reduction are all enforced at the service layer, not just the database
- **Accessible UI** — All form controls, icon buttons, and interactive elements carry proper ARIA labels and linked `<label>` associations, passing accessibility linting
- **Resilient order flow** — Cancelling an order automatically restores inventory; duplicate products in a single order are rejected cleanly
- **Zero hardcoded config** — Every secret and URL is driven by environment variables; the app runs identically locally and in production via Docker Compose
- **CI pipeline included** — GitHub Actions runs the full test suite and a production build on every push

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Python 3.12, FastAPI | Async-ready, auto-generated OpenAPI docs, type-safe |
| ORM / Migrations | SQLAlchemy 2.0 | Declarative mapped columns, full type inference |
| Validation | Pydantic v2 | Fast, strict schema validation with custom validators |
| Frontend | React 18 + TypeScript | Component model, strict typing, excellent ecosystem |
| State / Data Fetching | TanStack Query | Automatic cache invalidation, background refetching |
| Styling | Tailwind CSS | Utility-first, consistent design tokens, no CSS drift |
| Database | PostgreSQL 16 | Battle-tested RDBMS, strong ACID guarantees |
| Containerisation | Docker + Compose | Reproducible builds, single-command startup |
| CI/CD | GitHub Actions | Automated tests and production build on every push |

---

## System Architecture

```
┌──────────────────────┐          HTTP / REST          ┌──────────────────────┐
│   React + TypeScript │  ───────────────────────────▶  │   FastAPI (Python)   │
│   TanStack Query     │  ◀───────────────────────────  │   Service Layer      │
│   Tailwind CSS       │          JSON responses         │   Pydantic Schemas   │
└──────────────────────┘                                 └──────────┬───────────┘
        :5173 / :80                                                  │ SQLAlchemy ORM
                                                         ┌──────────▼───────────┐
                                                         │   PostgreSQL 16       │
                                                         │   Products            │
                                                         │   Customers           │
                                                         │   Orders + Items      │
                                                         └──────────────────────┘
                                                                   :5432
```

### Business Rules (enforced at service layer)

| Rule | Implementation |
|------|----------------|
| Unique product SKUs | Pre-check + DB unique constraint + 409 response |
| Unique customer emails | Pre-check + DB unique constraint + 409 response |
| Stock validation before order | Checked per line item before any write |
| Atomic stock reduction | All decrements inside a single DB transaction |
| Stock restoration on cancel | Order cancellation increments stock back |
| Duplicate items per order | Rejected with a clear validation message |

---

## Quick Start (Docker — recommended)

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd inventory-management

# 2. Create your environment file
cp .env.example .env

# 3. Start all three services (DB, backend, frontend)
docker compose up --build
```

| Service | Local URL |
|---------|-----------|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger UI) | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

The database is automatically created and seeded with sample products and customers on first run.

```bash
docker compose down       # Stop containers
docker compose down -v    # Stop and wipe the database volume
```

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # Set DATABASE_URL to your local PostgreSQL
python seed.py                    # Create tables and seed sample data
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env              # Set VITE_API_URL=http://localhost:8000
npm run dev
```

### Tests

```bash
cd backend
pytest tests/ -v
```

All 7 tests run against an in-memory SQLite database — no PostgreSQL needed for the test suite.

---

## API Reference

Full interactive documentation is available at `/docs` (Swagger UI) and `/redoc`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/api/v1/products` | List products — supports `?search=` |
| `POST` | `/api/v1/products` | Create product (unique SKU enforced) |
| `PUT` | `/api/v1/products/{id}` | Update product details or stock |
| `DELETE` | `/api/v1/products/{id}` | Remove product |
| `GET` | `/api/v1/customers` | List customers — supports `?search=` |
| `POST` | `/api/v1/customers` | Create customer (unique email enforced) |
| `PUT` | `/api/v1/customers/{id}` | Update customer |
| `DELETE` | `/api/v1/customers/{id}` | Remove customer |
| `GET` | `/api/v1/orders` | List all orders with items |
| `POST` | `/api/v1/orders` | Place order (stock validated atomically) |
| `PATCH` | `/api/v1/orders/{id}/status` | Advance order status |
| `GET` | `/api/v1/dashboard/stats` | Aggregate stats (products, customers, revenue) |
| `GET` | `/api/v1/dashboard/inventory-alerts` | Low stock and out-of-stock alerts |

---

## Project Structure

```
inventory-management/
├── backend/
│   ├── app/
│   │   ├── api/            # Thin route handlers — no business logic
│   │   ├── core/           # Settings (pydantic-settings), DB engine, session
│   │   ├── models/         # SQLAlchemy ORM models (Product, Customer, Order, OrderItem)
│   │   ├── schemas/        # Pydantic request/response schemas with validators
│   │   ├── services/       # All business logic lives here (product, customer, order, dashboard)
│   │   └── main.py         # App factory, CORS, lifespan
│   ├── tests/
│   │   └── test_api.py     # 7 integration tests covering all business rules
│   ├── seed.py             # Creates tables and seeds demo data
│   ├── pytest.ini
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Typed API client (fetch wrapper + shared types)
│   │   ├── components/     # Layout, Modal, StatCard, EmptyState, Spinner
│   │   └── pages/          # Dashboard, Products, Customers, Orders
│   ├── nginx.conf          # SPA routing + gzip for production image
│   ├── Dockerfile          # Multi-stage: Node build → nginx:alpine
│   └── package.json
├── docker-compose.yml      # Orchestrates db → backend → frontend with health checks
├── render.yaml             # One-click backend deploy config for Render.com
├── .github/
│   └── workflows/ci.yml    # CI: backend tests + frontend build + Docker build
├── .env.example
├── DEPLOYMENT.md           # Step-by-step free-tier deployment guide
└── SUBMISSION.md           # Submission checklist with live URLs
```

---

## Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Backend | Full PostgreSQL connection string |
| `CORS_ORIGINS` | Backend | Comma-separated list of allowed origins |
| `POSTGRES_USER` | Docker | Database username |
| `POSTGRES_PASSWORD` | Docker | Database password |
| `POSTGRES_DB` | Docker | Database name |
| `VITE_API_URL` | Frontend | Backend base URL consumed at build time |
| `DEBUG` | Backend | Set `true` only in local dev |

---

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for a full walkthrough using free-tier platforms:

- **Database** → [Neon](https://neon.tech) (serverless PostgreSQL)
- **Backend** → [Render](https://render.com) (uses the included `render.yaml`)
- **Frontend** → [Vercel](https://vercel.com) (auto-detects Vite)
- **Docker images** → [Docker Hub](https://hub.docker.com)

---

## Scaling to Lakhs of Users

This section documents the engineering decisions that would be required to take this system from a single-server deployment to one capable of handling 100,000+ concurrent users.

### Database

| Concern | Solution |
|---------|----------|
| Write throughput on orders | Row-level locking with `SELECT ... FOR UPDATE` on product rows to prevent overselling under concurrency |
| Read throughput | Add read replicas; route `GET` queries to replica pool via SQLAlchemy |
| Connection exhaustion | Replace direct psycopg2 connections with **PgBouncer** connection pooling |
| Query performance | Add composite indexes on `(customer_id, created_at)` and `(product_id, stock_quantity)` as query patterns emerge |
| Data growth | Partition the `orders` table by `created_at` month; archive old partitions to cold storage |

### Backend

| Concern | Solution |
|---------|----------|
| Horizontal scaling | Run multiple Uvicorn workers behind a load balancer (NGINX or AWS ALB); stateless design already supports this |
| Async I/O | Migrate SQLAlchemy to its async engine (`AsyncSession`) and use `asyncpg` driver — FastAPI is already async-native |
| Rate limiting | Add per-IP and per-customer rate limiting at the API gateway layer (e.g. Kong, AWS API Gateway) |
| Background jobs | Move stock reduction and order confirmation emails to a task queue (**Celery + Redis** or **Dramatiq**) to keep the HTTP response time under 100 ms |
| Caching | Cache dashboard stats and product listings in **Redis** with a short TTL (~30 s); use cache-aside pattern |
| Observability | Integrate **OpenTelemetry** traces, structured JSON logs, and expose Prometheus `/metrics` for Grafana dashboards |

### Frontend

| Concern | Solution |
|---------|----------|
| Global CDN | Serve the static build from a CDN edge (Cloudflare, Vercel Edge Network) — already a static Vite build |
| API latency | Deploy the backend in the same region as the majority of users |
| Large data sets | Replace full-list fetches with server-side pagination and virtual scrolling (TanStack Virtual) |
| Real-time updates | Add WebSocket or SSE for live stock and order status updates instead of polling |

### Infrastructure

```
Users
  │
  ▼
CDN / Cloudflare (static assets, DDoS protection)
  │
  ▼
Load Balancer (NGINX / AWS ALB)
  │
  ├── Backend Pod 1 (FastAPI + Uvicorn)
  ├── Backend Pod 2
  └── Backend Pod N
          │
          ├── PgBouncer → PostgreSQL Primary (writes)
          │                └── Read Replica 1 (reads)
          │
          ├── Redis (cache + task queue broker)
          └── Celery Workers (async jobs)
```

Kubernetes (or ECS) handles pod autoscaling based on CPU and request queue depth. The database is the only stateful component and scales vertically first, then horizontally via read replicas.

