# FoodSwap POS

A simplified Point-of-Sale web application built with `Next.js`, `TypeScript`, and `Next.js Route Handlers`.

## Features

### Core POS Flow

- Product catalog with name, price, SKU, category, stock status, and images/placeholders
- Add products from the catalog into cart
- Update quantity, add notes, or remove items from cart
- Cart summary with subtotal, VAT (5%), discount (if promo applies), and final total
- Checkout with delivery details and payment step
- Order creation and persisted order history

### Customer Features

- Register, login, and logout with cookie-based sessions
- Protected routes for checkout, orders, and account
- Favorite products from catalog and manage them in account page
- Save delivery addresses, set default address, and delete saved addresses
- Promo code validation and discount calculation
- Delivery scheduling support (ASAP or selected date/time)
- Recommended products in cart based on co-purchase history
- Account profile updates (name + password)

### Admin Features

- Admin dashboard with revenue and operational summaries
- Product management (create, edit, and stock toggle)
- Order management (filter orders, inspect line items, update status: complete/refund/void)
- Promo code management (create, activate/deactivate, delete)
- Analytics endpoint + charts (revenue trend and top products)

### Reliability and UX Details

- Loading, error, and empty states across major pages
- Role-based behavior in both UI and API
- Server-side validation and status-specific API errors
- Stripe fallback to simulated payment when Stripe keys are missing
- Database health check endpoint (`/api/health/db`)

## Assessment Checklist

- Product management: done
- Cart + checkout: done
- Orders + persistence: done
- REST APIs + validation: done
- Test coverage: included (`npm test`)
- Bonus work included: taxes, promo codes, refund/void flow, role-based access, analytics, recommendations, dark mode

## Tech Stack

- Next.js 15 (App Router)
- TypeScript + React hooks
- Tailwind CSS
- Prisma + PostgreSQL
- Jest testing
- Stripe (optional)

## Scripts

- `npm run dev` - run development server
- `npm run build` - build for production
- `npm run start` - run production build
- `npm run lint` - lint project
- `npm test` - run tests

## Main API Endpoints

### Auth and Session
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/auth/me` (update name/password)

### Products
- `GET /api/products`
- `POST /api/products` (admin)
- `GET /api/products/:id`
- `PATCH /api/products/:id` (admin)

### Cart
- `GET /api/cart`
- `DELETE /api/cart`
- `POST /api/cart/items`
- `PUT /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`

### Checkout and orders
- `PUT /api/checkout` (create Stripe PaymentIntent)
- `POST /api/checkout` (create order)
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id` (admin status update)

### Favorites and Recommendations
- `GET /api/favorites`
- `POST /api/favorites` (toggle favorite)
- `GET /api/recommendations?productIds=...`

### Addresses and Promos
- `GET /api/addresses`
- `POST /api/addresses`
- `PATCH /api/addresses/:id`
- `DELETE /api/addresses/:id`
- `GET /api/promo/:code`

### Admin
- `GET /api/admin/analytics`
- `GET /api/admin/promos`
- `POST /api/admin/promos`
- `PATCH /api/admin/promos/:id`
- `DELETE /api/admin/promos/:id`

### Health
- `GET /api/health/db`

## Project Structure

```text
src/
  app/
    api/                 # backend route handlers
    page.tsx             # products/catalog
    cart/page.tsx
    checkout/page.tsx
    orders/page.tsx
    account/page.tsx
    login/page.tsx
    register/page.tsx
    admin/               # admin dashboard, products, orders, promotions
  components/            # reusable UI and feature components
  context/               # auth/session context
  lib/                   # db, auth, store, types, utils
  middleware.ts          # route protection
prisma/
  schema.prisma
```

## Short Answers

### 1) How did you structure the POS flow (products → cart → checkout → orders)?

The flow is intentionally simple and step-by-step, similar to a real POS:

1. **Products page (`/`)**  
   Products are fetched from `GET /api/products` and shown with name, price, and SKU.  
   Users can add items to cart from here.
2. **Cart page (`/cart`)**  
   Users can increase quantity, decrease quantity, or remove an item.  
   These actions call cart APIs and return the updated cart.
3. **Checkout page (`/checkout`)**  
   Delivery and payment fields are validated, then payment is processed (simulated or Stripe test mode).
4. **Order creation**  
   If payment succeeds, backend creates an order from current cart data and clears the cart.
5. **Orders page (`/orders`)**  
   Saved orders are fetched and shown with total, date, and status.

This gives clear separation between selection, cart handling, and final order creation.

### 2) How did you manage the state between cart and backend?

A frontend + backend mix is used, but backend remains the source of truth:

- On frontend, I use React state/hooks to keep the UI fast and responsive.
- Cart data is stored in PostgreSQL using Prisma.
- Every cart change (`add`, `update`, `remove`) goes through API endpoints.
- After each API call, I update local cart state from the server response.

So the UI feels quick, but data still stays correct because backend controls final cart state.

### 3) What trade-offs did you make?

- A **Next.js monolith** was used (frontend + API in one app).  
  It is faster to build and easier to manage for this task, but less flexible than separate services.
- **Simple state sync** was used instead of complex optimistic conflict logic.  
  It is easier to maintain, but depends more on API round-trips.
- **Simulated payment** was kept as default and Stripe was made optional.  
  This makes local testing easy, but full production payment flows need more work.
  
### 4) What would you change if this needed to scale to many stores?

- Add **multi-store architecture** by introducing `storeId` in all core tables (products, carts, orders, users).
- Use **PostgreSQL + read replicas** for scale, and **Redis** for hot data like product lists and active cart lookups.
- Add stronger **RBAC** with clear store-level roles (admin, manager, cashier), plus audit logs for sensitive actions.
- Make checkout fully reliable using **idempotency keys** + **Stripe webhooks** (`payment_intent.succeeded`, etc.).
- Move background work (emails, analytics sync, payout tasks) to queues like **BullMQ / SQS**.
- Improve observability with **Sentry** (errors), **Prometheus + Grafana** (metrics), and centralized logs (ELK/OpenSearch).
- For analytics at scale, use a reporting pipeline (scheduled ETL to **BigQuery / ClickHouse**) instead of running heavy queries on transactional DB.
- Production setup would use **Docker**, CI/CD via **GitHub Actions**, and deploy on **AWS / GCP / Vercel** based on traffic profile.
