# Inventory Manager Pro (MERN)

Production-ready MERN inventory management system with JWT auth, role-based access, product lifecycle management, stock movement tracking, and dashboard analytics.

## Features

- JWT authentication with role-based authorization (`admin`, `viewer`)
- Product CRUD with required fields:
  - `name`, `sku` (unique), `category`, `price`, `quantity`, `lowStockThreshold`, `description`
- Product listing with search, category filter, low-stock filter, pagination, and sorting
- Stock movement logging (`IN` / `OUT`) with timestamped audit history
- Negative stock protection (atomic movement updates)
- Dashboard summary:
  - total products
  - low-stock alerts
  - recent movements
  - category and stock value metrics
- Frontend state management using Redux Toolkit + RTK Query
- Backend validation and consistent API error contracts

## Monorepo Layout

- `artifacts/api-server` - Express + Mongoose API (TypeScript)
- `artifacts/inventory` - React + Vite SPA (TypeScript)
- `lib/api-spec/openapi.yaml` - OpenAPI specification

## Prerequisites

- Node.js 20+
- pnpm 9+
- MongoDB (local or hosted) for persistent environments

## Environment Variables

Copy `.env.example` to `.env` and adjust values.

- `JWT_SECRET`: secret used to sign/verify JWT tokens
- `MONGODB_URI`: Mongo connection string (required in production)
- `API_PORT`: backend port
- `FRONTEND_PORT`: frontend port
- `BASE_PATH`: frontend base path (typically `/`)

## Local Development

Install dependencies:

```bash
pnpm install
```

Run backend:

```bash
cd artifacts/api-server
PORT=4000 JWT_SECRET=dev-secret MONGODB_URI=mongodb://127.0.0.1:27017/inventory pnpm run build
PORT=4000 JWT_SECRET=dev-secret MONGODB_URI=mongodb://127.0.0.1:27017/inventory pnpm run start
```

Run frontend:

```bash
cd artifacts/inventory
PORT=5173 BASE_PATH=/ pnpm run dev
```

Frontend calls backend at `${BASE_PATH}/api`.

## Tests

Backend API tests:

```bash
cd artifacts/api-server
pnpm test
```

## Deployment (Docker Compose)

Use the provided `docker-compose.yml`:

```bash
docker compose up --build
```

Services:

- `mongo` on `27017`
- `api` on `4000`
- `web` on `8080`

## API Design Notes

- Auth endpoints: `/api/auth/*`
- Product endpoints: `/api/products/*`
- Movement endpoints: `/api/movements/*`
- Dashboard endpoint: `/api/dashboard/summary`
- Standard error format:

```json
{
  "message": "Human readable error",
  "details": {}
}
```

## Default Seed Users

On first startup, seed creates:

- `admin@warehouse.local` / `admin123`
- `viewer@warehouse.local` / `viewer123`

Override with:

- `SEED_ADMIN_PASSWORD`
- `SEED_VIEWER_PASSWORD`
