# FoodSwap POS

A simplified Point-of-Sale web application built with `Next.js`, `TypeScript`, and `Next.js Route Handlers`.

The project covers the full assessment flow: product listing, cart management, checkout, and persisted orders.

## Assignment Coverage

### 1) Product Management

- Product list includes `name`, `price`, and `sku/id`
- Add product to cart
- Update quantity in cart
- Remove product from cart

### 2) Cart and Checkout

- Cart summary includes line items, subtotal, tax, and total
- Checkout supports:
  - simulated payment (works without Stripe)
  - Stripe test mode via PaymentIntent + Payment Element

### 3) Orders

- Checkout creates an order record on backend
- Order data persists in PostgreSQL (Prisma)
- Orders page lists past orders with total, date, and status

### 4) Technical Requirements

- Next.js + TypeScript
- Functional React components + hooks
- Reusable component structure in `src/components`
- Loading, error, and empty states handled across key pages
- REST APIs for products, cart, orders, and related flows
- Validation and error handling in API handlers
- Includes tests (`npm test`)

### Additional Features Included

- Taxes + promo discounts
- Refund / void order status flow
- Role-based access (`customer` / `admin`)
- Admin analytics dashboard
- Light/dark mode
- Product recommendation endpoint

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
- `PATCH /api/orders/:id`

## Project Structure

```text
src/
  app/
    api/                 # backend route handlers
    page.tsx             # products/catalog
    cart/page.tsx
    checkout/page.tsx
    orders/page.tsx
    admin/               # admin features (bonus)
  components/            # reusable UI and feature components
  context/               # auth/session context
  lib/                   # db, auth, store, types, utils
  middleware.ts          # route protection
prisma/
  schema.prisma
```

## Short Answers

### 1) How did you structure the POS flow (products → cart → checkout → orders)?

I structured the system as a linear transactional flow, with each step mapped to both a dedicated UI route and a backend API boundary:

1. **Products (`/`)**  
   The page fetches products from `GET /api/products` and renders actionable product cards.
2. **Cart (`/cart`)**  
   Item mutations (`add`, `update quantity`, `remove`) call cart endpoints and return the updated cart payload.
3. **Checkout (`/checkout`)**  
   Delivery/payment details are validated, then payment is processed via simulated mode or Stripe test mode.
4. **Order creation**  
   On successful checkout, backend creates an order record from a cart snapshot and clears the cart.
5. **Orders (`/orders`)**  
   The orders page reads persisted orders and displays total, date, and status.

This sequence keeps responsibilities clear and makes the flow easy to test end-to-end.

### 2) How did you manage the state between cart and backend?

I used a server-authoritative cart model:

- The cart is persisted in PostgreSQL (via Prisma).
- Frontend state is a local UI projection only.
- Every cart mutation goes through an API endpoint.
- The client replaces local cart state with the latest server response after each mutation.

This approach avoids client/server drift, keeps business rules centralized on the backend, and simplifies debugging.

### 3) What trade-offs did you make?

- **Monolith architecture (`Next.js` UI + API):** faster delivery and fewer moving parts, but tighter coupling than split services.
- **Server-sync cart updates over optimistic conflict handling:** simpler and safer consistency model, with slightly higher API round-trip dependency.
- **Simulated payment fallback:** excellent developer/test ergonomics, but not a replacement for full production payment workflows.
- **Pragmatic validation scope:** focused on core correctness and API safety rather than full enterprise-level validation rules.

### 4) What would you change if this needed to scale to many stores?

- Introduce a **multi-tenant schema** with `storeId` isolation across products, carts, orders, and users.
- Add **store-scoped RBAC** (admin, manager, cashier) with stricter authorization boundaries.
- Make checkout **idempotent** and shift payment finalization to **webhook-driven** processing.
- Add **caching** (e.g., Redis) for hot catalog/cart reads and queue-based async processing for non-critical tasks.
- Move analytics to dedicated reporting pipelines (materialized views / OLAP tables) to protect transactional workloads.
- Split the backend into modular services once traffic and team complexity justify operational overhead.
