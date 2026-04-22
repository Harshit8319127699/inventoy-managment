# Warehouse Inventory Management System (MERN)

## Overview

A small-warehouse Inventory Management System built on a MERN-style stack inside the Replit pnpm monorepo:

- **MongoDB** (via Mongoose) for products, stock movements, and users
- **Express 5** API with JWT auth and role-based access (admin / viewer)
- **React + Vite** SPA with **Redux Toolkit + RTK Query**
- **TypeScript** across the stack, **Zod** for request validation

## Stack

- **Monorepo**: pnpm workspaces, TypeScript 5.9, Node 24
- **API**: Express 5, Mongoose 8, JWT (`jsonwebtoken`), `bcryptjs`, Pino, Zod
- **Frontend**: React 19 + Vite 7, Redux Toolkit + RTK Query, react-hook-form, shadcn/ui, Tailwind v4, recharts, framer-motion, wouter
- **DB**: MongoDB. If `MONGODB_URI` is not set, the server starts an embedded `mongodb-memory-server` (data resets on restart) so the app works out of the box.

## Project layout

```
artifacts/
  api-server/      Express + Mongoose + JWT API (mounted at /api)
  inventory/       React + Vite + RTK Query frontend (mounted at /)
  mockup-sandbox/  Unused (default scaffold)
lib/               Shared libs (db / api-zod / api-client-react are unused for this project)
```

## Default credentials (auto-seeded on first run)

- Admin: `admin@warehouse.local` / `admin123`
- Viewer: `viewer@warehouse.local` / `viewer123`

Override via `SEED_ADMIN_PASSWORD` / `SEED_VIEWER_PASSWORD` env vars.

## API

Base path: `/api`. JWT bearer token required on everything except `/auth/login` and the first `/auth/register`.

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| POST | `/auth/login` | public | `{ email, password }` -> `{ token, user }` |
| POST | `/auth/register` | first user = admin, then admin only | create users |
| GET  | `/auth/me` | any | current user |
| GET  | `/auth/users` | admin | list users |
| GET  | `/products` | any | `?search=&category=&lowStock=&page=&limit=&sort=` |
| GET  | `/products/categories` | any | distinct categories |
| GET  | `/products/:id` | any | |
| POST | `/products` | admin | create |
| PATCH| `/products/:id` | admin | partial update |
| DELETE | `/products/:id` | admin | also deletes its movements |
| GET  | `/movements` | any | `?productId=&type=&page=&limit=` |
| POST | `/movements` | admin | `{ productId, type: IN|OUT, quantity, note? }` — server enforces stock cannot go negative |
| GET  | `/dashboard/summary` | any | totals, low-stock items, recent movements, 14-day chart, category breakdown |
| GET  | `/healthz` | public | health probe |

## Environment variables

- `JWT_SECRET` (falls back to `SESSION_SECRET`) — required to sign tokens
- `MONGODB_URI` — optional. If unset, an embedded MongoDB is used.
- `SEED_ADMIN_PASSWORD`, `SEED_VIEWER_PASSWORD` — override demo passwords
- `PORT` — managed automatically by the platform per artifact

## Key commands

- `pnpm install` — install everything
- API server runs via the workspace workflow (`pnpm --filter @workspace/api-server run dev`)
- Frontend runs via the workspace workflow (`pnpm --filter @workspace/inventory run dev`)

## Deployment notes

When publishing, set `JWT_SECRET` and `MONGODB_URI` (e.g. a MongoDB Atlas connection string) so data persists across restarts.
