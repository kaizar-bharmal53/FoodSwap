# FoodSwap POS

A Point-of-Sale web application built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Product catalog** — browsable grid with search and category filters
- **Cart** — add, update quantity, remove items; live subtotal + tax
- **Checkout** — Stripe test-mode payments *or* one-click simulated payment (no Stripe keys needed)
- **Orders** — persisted order history with refund/void support
- **Dark mode** — system-preference aware, user-toggleable
- **Responsive** — works on mobile through wide desktop

---

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
cd FoodSwap
npm install
```

### Environment (optional — Stripe)

Copy the example file and fill in your [Stripe test keys](https://dashboard.stripe.com/test/apikeys):

```bash
cp .env.local.example .env.local
# Edit .env.local with your keys
```

If you skip this step, the app falls back to **simulated payment** automatically — everything works except the Stripe card form.

### Run

```bash
npm run dev
# Open http://localhost:3000
```

### Test

```bash
npm test
```

---

## Project structure

```
src/
├── app/
│   ├── api/                  # Next.js Route Handlers (REST API)
│   │   ├── products/         GET, POST, PATCH /:id
│   │   ├── cart/             GET, DELETE (clear)
│   │   ├── cart/items/       POST (add), PUT /:productId, DELETE /:productId
│   │   ├── checkout/         POST (complete order), PUT (create PaymentIntent)
│   │   └── orders/           GET, PATCH /:id (status update)
│   ├── page.tsx              Product catalog
│   ├── cart/page.tsx         Cart review
│   ├── checkout/page.tsx     Payment page
│   └── orders/page.tsx       Order history
├── components/
│   ├── ui/                   Button, Badge, EmptyState (primitives)
│   ├── Header.tsx            Nav with live cart count
│   ├── ProductCard.tsx       Product tile with add-to-cart
│   ├── CartItemRow.tsx       Cart line item with stepper
│   ├── OrderCard.tsx         Collapsible order with refund action
│   ├── StripeCheckoutForm.tsx Stripe Elements wrapper
│   └── ThemeToggle.tsx       Light/dark toggle
├── lib/
│   ├── types.ts              Shared TypeScript interfaces
│   ├── store.ts              In-memory data store + business logic
│   └── utils.ts              formatCents, formatDate, cn()
└── __tests__/
    └── api.test.ts           Store unit + integration tests (19 cases)
```

---

## REST API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/products` | List all products |
| `POST` | `/api/products` | Create product |
| `GET` | `/api/products/:id` | Get product |
| `PATCH` | `/api/products/:id` | Update product |
| `GET` | `/api/cart` | Get active cart |
| `DELETE` | `/api/cart` | Clear cart |
| `POST` | `/api/cart/items` | Add item `{ productId, quantity }` |
| `PUT` | `/api/cart/items/:productId` | Update quantity `{ quantity }` |
| `DELETE` | `/api/cart/items/:productId` | Remove item |
| `PUT` | `/api/checkout` | Create Stripe PaymentIntent |
| `POST` | `/api/checkout` | Complete order `{ paymentMethod, paymentIntentId? }` |
| `GET` | `/api/orders` | List all orders |
| `GET` | `/api/orders/:id` | Get order |
| `PATCH` | `/api/orders/:id` | Update status `{ status }` |

---

## Short answers

### How did you structure the POS flow?

The flow mirrors the in-store experience as a linear funnel:

1. **Products (`/`)** — merchant selects items; each "Add" fires `POST /api/cart/items` and the UI reflects the updated count badge immediately (optimistic feel without full optimistic UI).
2. **Cart (`/cart`)** — reviews line items, adjusts quantities. All mutations are fire-and-replace: the response cart replaces local state, so the UI is always server-authoritative.
3. **Checkout (`/checkout`)** — order summary + payment. If Stripe keys exist, the page calls `PUT /api/checkout` to create a `PaymentIntent` server-side (keeping the secret key out of the browser), renders Stripe Elements, then on success calls `POST /api/checkout` with the confirmed `paymentIntentId`. If Stripe is not configured, it falls back to a simulated form.
4. **Orders (`/orders`)** — shows the completed order immediately via a success banner and lists all historical orders with refund support.

### How did you manage state between cart and backend?

The server is the source of truth. The frontend holds a local copy of the cart (`useState`) and **always replaces it with the response from mutating API calls**. There's no local reconciliation logic — mutations return the full cart object and that replaces state entirely. This makes the cart naturally consistent without Zustand, Redux, or any client-side store. The trade-off is a round-trip on every quantity change; at this scale that's imperceptible.

The cart lives in the in-memory module singleton. In production this would be a database record keyed by session/terminal ID.

### What trade-offs did you make?

| Decision | Trade-off |
|----------|-----------|
| In-memory store | No persistence across server restarts; simple and dependency-free for this scope |
| Single active cart | No multi-session support; fine for a single-terminal demo |
| Server-authoritative state | Extra round-trips vs. optimistic UI; removes complex reconciliation code |
| Next.js API routes | Co-located with the frontend; slightly harder to split into a separate microservice later |
| No state manager (Zustand/Redux) | Less boilerplate; works because state is shallow and co-located with pages |
| Stripe Elements in browser | Card data never touches our server; PCI-DSS compliant by design |

### What would you change if this needed to scale to many stores?

1. **Database** — Replace the in-memory map with PostgreSQL (or PlanetScale). Add a `store_id` foreign key to products, carts, and orders so data is partitioned per merchant.
2. **Auth** — Add session-based or JWT auth. Different roles (cashier vs. admin) control who can void orders, add products, or see the analytics view.
3. **Separate API service** — Extract the Next.js API routes into a standalone Node/Express service so the POS frontend and future mobile app can both consume the same backend.
4. **Cart as a session** — Key carts by `(store_id, terminal_id, session_id)` rather than a module-level singleton.
5. **Webhooks for payment state** — Instead of verifying the PaymentIntent inline, listen to `payment_intent.succeeded` Stripe webhooks to make order creation resilient to network failures at the checkout moment.
6. **Real-time cart sync** — For shared terminals, use Server-Sent Events or WebSockets so two cashiers on the same cart see each other's changes.
7. **Analytics** — A read-replica or OLAP store (e.g. ClickHouse) for sales-summary queries that shouldn't hit the transactional database.
