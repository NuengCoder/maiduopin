# maiduopin (卖多品) — Implementation Plan

> **Status:** Draft v1 · 2026-11-24
> **Repository:** `C:\Users\Trivico\Desktop\Year3Programing\seo\maiduopin`
> **Target:** WeChat Mini Program marketplace with Pinduoduo-style growth mechanics
> **This document is a plan only.** No application code has been changed.

---

## 1. Executive summary

`maiduopin` is a WeChat Mini Program marketplace where buyers discover products, form groups, bargain, join flash sales, collect coupons, and place orders. Sellers/operators manage products, inventory, campaigns, and fulfillment from a web admin portal.

The current repository is the stock **WeChat Mini Program TypeScript + Less quickstart**. It contains no commerce code, no real authentication, no API layer, no state management, and no tests. The product therefore needs to be built almost entirely from scratch on top of the existing shell.

**Recommended delivery shape:**

1. **Buyer Mini Program** — native WeChat Mini Program, TypeScript, Less, custom navigation, custom tab bar, subpackages.
2. **REST API server** — Node.js 22 LTS + NestJS + PostgreSQL + Prisma + Redis + BullMQ.
3. **Admin/Seller web portal** — React + Vite + Ant Design, sharing the same REST API with role-based access.
4. **Mock payment** for v1, behind a payment-provider interface so real WeChat Pay can be added later.

**Full-scope estimate:** 40–52 person-days of focused work, roughly **10–12 weeks solo full-time** including buffer, or **4–5 months part-time**. A reduced demo cut is described in §15.4.

---

## 2. Locked decisions

| Decision | Choice | Consequence |
|---|---|---|
| Backend | **External REST API** | Separate server, HTTPS domain, WeChat request-domain whitelist, JWT auth. |
| V1 product scope | **Full PDD-style growth** | Group buy, bargain, flash sale, coupons, referrals, reviews, customer support. |
| Payment | **Mock payment** | Order and refund flows are fully testable without a merchant account. Must be impossible to enable in production. |
| Client | Native Mini Program, TypeScript + Less | No Taro/uni-app rewrite; keep existing `miniprogramRoot`. |
| Admin | Web portal, not a Mini Program | Faster to build and safer for operational tools. Seller role scoping included. |
| UI language | Chinese | Product copy, date/money formatting, and legal pages in Chinese. |
| Backend stack | Node/NestJS assumed | If an existing backend exists, keep the API contract and adapt the implementation. |

---

## 3. Current repository assessment

### 3.1 What exists

| Path | Current state | Plan impact |
|---|---|---|
| `miniprogram/app.json` | Two pages: `pages/index/index`, `pages/logs/logs`; custom navigation; Skyline; `glass-easel`; lazy code loading. | Replace page list, add tab bar, subpackages, `preloadRule`. |
| `miniprogram/app.ts` | Logs launch, stores timestamps, calls `wx.login` but sends the code nowhere. | Replace with auth bootstrap, update manager, global error handling. |
| `miniprogram/app.less` | One stock `.container` rule. | Replace with design tokens, base/reset, shared utilities. |
| `miniprogram/pages/index/*` | Stock profile demo using `wx.getUserProfile`. | Remove/repurpose; current API is no longer the recommended profile flow. |
| `miniprogram/pages/logs/*` | Stock log page. | Remove, or keep behind a developer-only route. |
| `miniprogram/components/navigation-bar/*` | WeUI-style custom nav with a `home` tap handler referenced in WXML but not implemented in TS. | Reuse and fix; add search slot and transparent mode. |
| `miniprogram/utils/util.ts` | Only `formatTime`. | Add money, date, debounce, share-param, validation, and error helpers. |
| `typings/index.d.ts` | Only `IAppOption` with optional `userInfo`. | Extend with session, config, and store types. |
| `project.config.json` | TS + Less compilers, Skyline enabled, AppID present, base library `2.32.3`. | Verify Skyline base-library compatibility; likely upgrade lib or disable Skyline per page. |
| `tsconfig.json` | Strict mode, `noUnusedLocals`, `noUnusedParameters`, ES2020, CommonJS. | CI must run `tsc --noEmit`; generated types must stay clean. |

### 3.2 Notable gaps

- No API client, environment configuration, auth/session handling, or error model.
- No state management; `IAppOption.globalData` is empty.
- No product, cart, order, coupon, growth, or admin domain code.
- No tests, lint/format configuration, CI, Docker setup, or documentation.
- The directory is not a Git repository.
- Local Node is `v26.3.0`; pin the backend to **Node 22 LTS** in `.nvmrc`/Docker to avoid native-module and tooling surprises.
- `libVersion` `2.32.3` conflicts with the Skyline `sdkVersionBegin: "3.0.0"` in `app.json`. Resolve before building screens: use a 3.x base library for Skyline, or disable Skyline and use WebView rendering per problematic page.

### 3.3 Implication

Treat this as a **greenfield product on a stock shell**. Phase 0 should replace the demo surface and establish the API contract before page work begins.

---

## 4. Product scope

### 4.1 Roles

| Role | Surface | Capabilities |
|---|---|---|
| Buyer | Mini Program | Browse, search, cart, checkout, orders, group buy, bargain, flash sale, coupons, referrals, reviews, favorites, support. |
| Seller | Admin web portal (seller-scoped) | Manage own shop, products, SKUs, stock, campaigns, orders, shipment. |
| Platform admin | Admin web portal | All seller capabilities, category management, platform coupons, user/order oversight, audit logs, dashboards. |
| Customer service | WeChat customer service first | Answer order/product questions; optional in-app IM later. |

### 4.2 Buyer Mini Program features

**Catalog and discovery**

- Home feed: banners, category shortcuts, flash-sale strip, group-buy feed, curated/recommended products.
- Category browsing with two-level category navigation.
- Search: hot keywords, suggestions, filters (category, price, sales), sort (relevance, sales, price).
- Product detail: image gallery, price/market price, sales count, SKU selector, shop card, reviews, share, favorites.
- Browsing history and favorites.

**Commerce**

- Cart: add/update/remove, select/deselect, select all, quantity limits, invalid-item handling, guest cart merge after login.
- Address book: create/edit/delete/default address.
- Checkout preview: item snapshot, address, coupon selection, shipping, price breakdown, agreement checkbox.
- Order creation with idempotency, mock payment, payment timeout, cancel, confirm receipt.
- Order list/detail with status timeline, tracking timeline, aftersales entry.
- Reviews: rating, text, image upload, moderation, display on product page.
- Aftersales: refund-only and return/refund request (v1 can use a simplified approval flow).
- In-app notifications plus WeChat subscription messages for group success and shipment.

**Growth mechanics**

- **Group buy (拼团):** start a group or join an open group; group size, group price, expiry; share to invite; success ships, failure auto-refunds.
- **Bargain (砍价):** start a bargain, share to helpers, each helper cuts once, price floors at a configured minimum, expiry, checkout at current price.
- **Flash sale (限时秒杀):** sessions with countdown, per-user limit, stock reservation, sold-out state.
- **Coupons (优惠券):** platform/shop/product coupons, claim center, my coupons, automatic best-coupon selection, lock/use/release.
- **Referral (邀请有礼):** invite link/code, new-user binding, reward after invitee's first paid order, anti-self-invite.
- **Customer support:** WeChat customer-service entry from product, order, and profile pages. Optional buyer-seller IM later.

### 4.3 Seller/admin features (minimum viable operations)

- Admin login and RBAC (`ADMIN`, `SELLER`).
- Shop profile, product and SKU CRUD, images, inventory adjustment.
- Order list, detail, ship with carrier/tracking number, refund approval.
- Campaign management: group activities, bargain activities, flash sessions, coupons.
- Dashboard: sales, orders, conversion, stock alerts.
- Audit log for sensitive actions.

### 4.4 Non-goals for v1

- Real WeChat Pay and real money settlement. Mock only; production release is blocked until real payment exists.
- Real logistics carrier integration (mock tracking timeline; manual tracking number first).
- ML recommendation; v1 uses rule-based ranking.
- Live streaming, short video commerce, and multi-level distribution/MLM.
- Full buyer-seller IM with voice/video. Use WeChat customer service first.
- Cross-border, multi-currency, and complex tax handling.
- Full financial ledger and seller settlement.

---

## 5. Target architecture

### 5.1 System diagram

```text
┌─────────────────────────────┐
│  WeChat Mini Program        │
│  Buyer app (TS + Less)      │
│  - pages / subpackages      │
│  - custom tab bar           │
│  - API client + store       │
└──────────────┬──────────────┘
               │ HTTPS / JSON / JWT
               ▼
┌─────────────────────────────┐        ┌──────────────────────────┐
│  REST API (NestJS)          │◄──────►│  Admin/Seller web portal │
│  /api/v1                    │  HTTPS │  React + Vite + AntD     │
│  auth, catalog, orders,     │        │  role-scoped operations  │
│  payments(mock), growth,    │        └──────────────────────────┘
│  coupons, reviews, admin    │
└──────┬───────────┬──────────┘
       │           │
       ▼           ▼
┌────────────┐ ┌────────────┐ ┌──────────────┐
│ PostgreSQL │ │   Redis    │ │ Object store │
│ Prisma     │ │ cache/     │ │ S3/MinIO/    │
│            │ │ locks/     │ │ COS/OSS      │
│            │ │ BullMQ     │ │ images       │
└────────────┘ └────────────┘ └──────────────┘
```

### 5.2 Stack

| Layer | Choice | Notes |
|---|---|---|
| Mini Program | Native TS + Less | Keep `miniprogram/`; no framework rewrite. |
| API | Node 22 LTS + NestJS | Modules, guards, DTO validation, Swagger/OpenAPI. |
| ORM | Prisma | Migrations, typed queries, seed script. |
| Database | PostgreSQL 16 | Transactions, row locks, check constraints, full-text search fallback. |
| Cache/queue | Redis 7 + BullMQ | Sessions/rate limits, flash stock, delayed jobs. |
| Files | S3-compatible storage | MinIO locally; COS/OSS in production; signed upload URLs. |
| API docs | OpenAPI 3 + Swagger UI | Generate client types with `openapi-typescript`. |
| Admin | React 19 + Vite + Ant Design | Seller and admin role scoping. |
| Tests | Jest + Supertest; `miniprogram-automator`; Playwright | Unit, API integration, Mini Program smoke, admin E2E. |
| Local infra | Docker Compose | Postgres, Redis, MinIO, API. |
| CI | GitHub Actions | Lint, typecheck, tests, build, Prisma migrate, optional Mini Program upload. |

### 5.3 Repository layout

Keep the existing Mini Program root working. Add server and admin as separate packages rather than npm workspaces initially, to avoid changing WeChat DevTools npm behavior.

```text
maiduopin/
  miniprogram/                  # existing WeChat Mini Program
    app.ts / app.json / app.less
    config/env.ts
    services/request.ts
    services/api/*.ts
    store/*.ts
    styles/tokens.less
    components/*
    custom-tab-bar/*
    pages/home|category|cart|profile|search|goods/*
    packageOrder/pages/*
    packageGrowth/pages/*
    packageUser/pages/*
    packageSeller/pages/*        # optional; hidden unless seller-in-app required
    types/api.gen.ts
    utils/*
  server/                       # new REST API
    src/
      main.ts
      app.module.ts
      common/                   # guards, filters, idempotency, pagination
      modules/auth|users|catalog|cart|pricing|orders|payments|
              inventory|coupons|growth|reviews|notifications|admin|uploads/*
      prisma/schema.prisma
      prisma/seed.ts
    test/
    Dockerfile
    .env.example
  admin/                        # new web portal
    src/pages|components|services/*
    Dockerfile
  docs/
    architecture.md
    product-rules.md
    security.md
    test-plan.md
    release-checklist.md
    runbook.md
  docker-compose.yml
  .nvmrc                        # 22
  README.md
```

### 5.4 Environments

| Environment | Mini Program env | API | Payment |
|---|---|---|---|
| Local | DevTools, `develop` | `http://localhost:3000` (DevTools only; "do not verify legal domains" enabled locally) | Mock |
| Staging | Trial version | `https://api-staging.example.com` | Mock |
| Production | Release | `https://api.example.com` | Real WeChat Pay only; mock hard-disabled |

`miniprogram/config/env.ts` selects the base URL from `__wxConfig.envVersion` (`develop` / `trial` / `release`), with an explicit override for local debugging. WeChat request, upload, and download domains must be whitelisted in the Mini Program admin console.

---

## 6. Domain model

All money is stored as **integer fen** (`BIGINT`/`INT`), never floating point. All timestamps are UTC. Every user-owned resource is checked against the authenticated user on the server.

### 6.1 Identity and users

| Table | Key fields | Invariants |
|---|---|---|
| `users` | `id`, `openid`, `unionid?`, `nickname`, `avatar_url`, `phone?`, `status`, `created_at` | `openid` unique; one user per WeChat account. |
| `user_profiles` | `user_id`, `gender?`, `birthday?`, `bio?` | 1:1 with user. |
| `addresses` | `id`, `user_id`, `receiver`, `phone`, `province/city/district`, `detail`, `is_default` | One default per user; ownership enforced. |
| `admin_users` | `id`, `email`, `password_hash`, `role`, `shop_id?`, `status` | RBAC; sellers scoped to `shop_id`. |
| `audit_logs` | `id`, `actor_id`, `action`, `target_type`, `target_id`, `payload_json`, `created_at` | Append-only. |

### 6.2 Catalog

| Table | Key fields | Invariants |
|---|---|---|
| `shops` | `id`, `owner_user_id`, `name`, `logo`, `description`, `status`, `rating` | Seller owns one shop in v1. |
| `categories` | `id`, `parent_id`, `name`, `icon`, `sort`, `status` | Two levels max. |
| `products` | `id`, `shop_id`, `category_id`, `title`, `subtitle`, `description_blocks_json`, `main_image`, `images_json`, `status`, `sales_count`, `rating` | On-sale products need at least one active SKU. |
| `product_skus` | `id`, `product_id`, `sku_code`, `spec_json`, `price_fen`, `market_price_fen`, `stock_available`, `stock_reserved`, `stock_sold`, `status` | `stock_available >= 0`; unique `product_id + sku_code`. |
| `favorites` | `user_id`, `product_id`, `created_at` | Unique pair. |
| `browse_history` | `user_id`, `product_id`, `last_viewed_at` | Upsert on view; cap history length. |

### 6.3 Cart and orders

| Table | Key fields | Invariants |
|---|---|---|
| `carts` | `id`, `user_id` | One active cart per user. |
| `cart_items` | `id`, `cart_id`, `sku_id`, `quantity`, `selected`, `activity_type?`, `activity_id?` | Unique `cart_id + sku_id + activity_type + activity_id`. |
| `orders` | `id`, `order_no`, `user_id`, `shop_id`, `status`, `source`, `total_fen`, `discount_fen`, `shipping_fen`, `pay_fen`, `coupon_claim_id?`, `address_snapshot_json`, `idempotency_key`, `expires_at`, `paid_at`, `created_at` | Unique `user_id + idempotency_key`; address is snapshotted. |
| `order_items` | `id`, `order_id`, `product_id`, `sku_id`, `title_snapshot`, `image_snapshot`, `spec_snapshot_json`, `unit_price_fen`, `quantity`, `activity_type?`, `activity_id?` | Prices/names snapshotted at order creation. |
| `payments` | `id`, `order_id`, `provider`, `provider_txn_id`, `amount_fen`, `status`, `raw_json` | One successful payment per order. |
| `refunds` | `id`, `order_id`, `payment_id`, `amount_fen`, `reason`, `status`, `provider_refund_id` | Idempotent refund requests. |
| `shipments` | `id`, `order_id`, `carrier`, `tracking_no`, `status`, `events_json`, `shipped_at` | One active shipment per order. |
| `after_sales` | `id`, `order_id`, `user_id`, `type`, `reason`, `description`, `images_json`, `status`, `resolution` | Ownership and order-state checks. |

**Order statuses:** `PENDING_PAYMENT`, `PAID`, `TO_SHIP`, `SHIPPED`, `COMPLETED`, `CANCELLED`, `REFUNDING`, `REFUNDED`.
Group progress is derived from the linked group instance and shown as "拼团中" without overloading the order status.

### 6.4 Growth

| Table | Key fields | Invariants |
|---|---|---|
| `group_activities` | `id`, `product_id`, `sku_id`, `group_size`, `group_price_fen`, `start_at`, `end_at`, `status` | Active window required. |
| `group_instances` | `id`, `activity_id`, `leader_user_id`, `status`, `required_count`, `paid_count`, `expires_at` | `paid_count <= required_count`; one leader per instance. |
| `group_members` | `id`, `group_id`, `user_id`, `order_id`, `status`, `joined_at` | Unique `group_id + user_id`; statuses `PENDING_PAYMENT`, `PAID`, `EXPIRED`, `REFUNDED`. |
| `bargain_activities` | `id`, `product_id`, `sku_id`, `start_price_fen`, `floor_price_fen`, `max_cuts`, `valid_hours`, `status` | `floor_price_fen <= start_price_fen`. |
| `bargain_instances` | `id`, `activity_id`, `user_id`, `current_price_fen`, `cut_count`, `status`, `expires_at` | One active instance per user/activity; status `ACTIVE`, `READY`, `ORDERED`, `EXPIRED`. |
| `bargain_cuts` | `id`, `bargain_id`, `helper_user_id`, `amount_fen`, `created_at` | Unique `bargain_id + helper_user_id`; no self-cut. |
| `flash_sessions` | `id`, `title`, `start_at`, `end_at`, `status` | Sessions do not overlap per configured slot. |
| `flash_items` | `id`, `session_id`, `sku_id`, `flash_price_fen`, `stock_total`, `stock_remaining`, `per_user_limit` | `stock_remaining >= 0`; DB check constraint. |
| `flash_reservations` | `id`, `item_id`, `user_id`, `quantity`, `status`, `expires_at` | Unique active reservation per user/item; statuses `HELD`, `CONSUMED`, `EXPIRED`. |
| `coupons` | `id`, `type`, `shop_id?`, `title`, `threshold_fen`, `discount_type`, `discount_value`, `total`, `claimed`, `per_user_limit`, `valid_from`, `valid_to`, `status` | Claim cap and validity enforced server-side. |
| `coupon_claims` | `id`, `coupon_id`, `user_id`, `status`, `order_id?`, `claimed_at`, `used_at` | Statuses `AVAILABLE`, `LOCKED`, `USED`, `EXPIRED`; unique claim per user/coupon within limit. |
| `referrals` | `id`, `inviter_user_id`, `invitee_user_id`, `scene`, `status`, `rewarded_at` | Unique invitee; no self-invite; no multi-level. |

### 6.5 Content and support

| Table | Key fields |
|---|---|
| `reviews` | `id`, `order_id`, `order_item_id`, `user_id`, `product_id`, `rating`, `content`, `images_json`, `status`, `created_at` |
| `notifications` | `id`, `user_id`, `type`, `title`, `body`, `payload_json`, `read_at`, `created_at` |
| `chat_conversations` / `chat_messages` | Optional in-app IM; `conversation_id`, `sender_id`, `content`, `content_type`, `created_at` |
| `banners` | `id`, `image`, `link_type`, `link_value`, `sort`, `start_at`, `end_at`, `status` |

### 6.6 Critical invariants

- Client-submitted prices are **never** trusted; the server recomputes every price.
- Stock cannot go negative: use DB check constraints plus transactions/Redis atomic operations.
- Order creation is idempotent per `user_id + Idempotency-Key`.
- Coupon, group slot, and flash stock are **reserved** on order creation, then **consumed** on payment or **released** on cancellation/timeout.
- Every ownership check is explicit: order, address, coupon, bargain, review, aftersales.
- Sensitive operations write `audit_logs`.

---

## 7. API contract

### 7.1 Conventions

- Base path: `/api/v1`.
- JSON over HTTPS; UTF-8.
- Success envelope:

```json
{ "code": 0, "message": "ok", "data": {}, "requestId": "..." }
```

- Error envelope:

```json
{ "code": "OUT_OF_STOCK", "message": "库存不足", "details": {}, "requestId": "..." }
```

- Pagination: `page`, `pageSize` (max 50), response `{ items, page, pageSize, total, hasMore }`. Cursor pagination for feeds if needed.
- Money: integer fen in requests and responses.
- Times: ISO-8601 UTC; client formats to local time.
- Authentication: `Authorization: Bearer <accessToken>`.
- Idempotency: `Idempotency-Key` header required for order creation, payment, refund, coupon claim, bargain cut, and group join.
- Rate limits: per user + IP for login, claim, cut, order creation, uploads.
- OpenAPI is the source of truth; Mini Program and admin types are generated from it in CI.

### 7.2 Endpoint surface

| Area | Method + path | Purpose | Auth |
|---|---|---|---|
| Auth | `POST /auth/wechat/login` | Exchange `wx.login` code for JWT | Public |
| Auth | `POST /auth/refresh` | Rotate refresh token | Public |
| Auth | `GET /me` | Current user/profile | User |
| Auth | `PATCH /me` | Update nickname/avatar | User |
| Auth | `POST /me/phone` | Bind phone via WeChat phone code | User |
| Home | `GET /home` | Banners, categories, flash strip, feeds | Public |
| Catalog | `GET /categories` | Category tree | Public |
| Catalog | `GET /products` | List/filter/sort products | Public |
| Catalog | `GET /products/:id` | Product detail with SKUs | Public |
| Catalog | `GET /products/:id/reviews` | Paginated reviews | Public |
| Search | `GET /search/hot` | Hot keywords | Public |
| Search | `GET /search/suggest` | Suggestions | Public |
| Cart | `GET /cart` | Server cart | User |
| Cart | `POST /cart/items` | Add item | User |
| Cart | `PATCH /cart/items/:id` | Quantity/selected | User |
| Cart | `DELETE /cart/items/:id` | Remove item | User |
| Cart | `POST /cart/merge` | Merge guest cart after login | User |
| Address | `GET/POST /addresses`, `PATCH/DELETE /addresses/:id` | Address CRUD | User |
| Checkout | `POST /checkout/preview` | Server-side price and coupon preview | User |
| Orders | `POST /orders` | Create order (idempotent) | User |
| Orders | `GET /orders`, `GET /orders/:id` | Order list/detail | User |
| Orders | `POST /orders/:id/cancel` | Cancel unpaid/eligible order | User |
| Orders | `POST /orders/:id/confirm` | Confirm receipt | User |
| Payment | `POST /orders/:id/mock-pay` | Mock success/failure; non-prod only | User |
| Fulfillment | `GET /orders/:id/logistics` | Tracking timeline | User |
| Aftersales | `POST /orders/:id/after-sales` | Create request | User |
| Reviews | `POST /orders/:id/reviews` | Create review with images | User |
| Favorites | `GET/POST/DELETE /favorites` | List/add/remove | User |
| History | `GET /history`, `DELETE /history` | Browse history | User |
| Coupons | `GET /coupons`, `POST /coupons/:id/claim` | Coupon center/claim | Public/User |
| Coupons | `GET /me/coupons` | My coupons | User |
| Group | `GET /group-activities/:id` | Activity detail | Public |
| Group | `POST /groups` | Start group + order | User |
| Group | `POST /groups/:id/join` | Join group + order | User |
| Group | `GET /groups/:id` | Group status/members | Public/User |
| Group | `GET /me/groups` | My groups | User |
| Bargain | `GET /bargain-activities/:id` | Activity detail | Public |
| Bargain | `POST /bargains` | Start bargain | User |
| Bargain | `POST /bargains/:id/cut` | Helper cuts once | User |
| Bargain | `POST /bargains/:id/checkout` | Order at current price | User |
| Bargain | `GET /me/bargains` | My bargains | User |
| Flash | `GET /flash-sessions`, `GET /flash-sessions/:id` | Sessions/items | Public |
| Flash | `POST /flash/items/:id/reserve` | Hold stock + create order | User |
| Referral | `GET /referral`, `POST /referral/bind` | Invite stats/bind inviter | User |
| Notifications | `GET /notifications`, `POST /notifications/:id/read` | In-app notifications | User |
| Support | `POST /support/chat` / WebSocket | Optional IM | User |
| Admin auth | `POST /admin/auth/login` | Admin login | Public |
| Admin catalog | `POST/PATCH /admin/products`, `PATCH /admin/skus/:id/stock` | Product/stock management | Seller/Admin |
| Admin orders | `GET /admin/orders`, `POST /admin/orders/:id/ship` | Fulfillment | Seller/Admin |
| Admin campaigns | CRUD `/admin/group-activities`, `/admin/bargain-activities`, `/admin/flash-sessions`, `/admin/coupons` | Campaign operations | Seller/Admin |
| Admin dashboard | `GET /admin/dashboard` | Metrics and alerts | Seller/Admin |
| Admin audit | `GET /admin/audit-logs` | Audit trail | Admin |

### 7.3 Error codes (client maps to Chinese copy)

`AUTH_REQUIRED`, `TOKEN_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`, `PRICE_CHANGED`, `OUT_OF_STOCK`, `COUPON_INVALID`, `COUPON_USED`, `ORDER_DUPLICATE`, `ORDER_STATE_INVALID`, `PAYMENT_FAILED`, `GROUP_FULL`, `GROUP_EXPIRED`, `BARGAIN_EXPIRED`, `BARGAIN_ALREADY_CUT`, `FLASH_NOT_STARTED`, `FLASH_SOLD_OUT`, `FLASH_LIMIT_REACHED`, `UPLOAD_REJECTED`.

### 7.4 Order creation example

```http
POST /api/v1/orders
Authorization: Bearer ...
Idempotency-Key: 8f1c...
Content-Type: application/json

{
  "source": "cart",
  "items": [{ "skuId": "sku_123", "quantity": 2 }],
  "addressId": "addr_1",
  "couponClaimId": "cc_9",
  "activity": { "type": "group", "id": "grp_5" }
}
```

Response contains `orderId`, `orderNo`, `status`, `payAmountFen`, `expiresAt`, and a `payment` descriptor. With mock payment, the descriptor points to the mock-pay action; with real WeChat Pay it would contain `timeStamp`, `nonceStr`, `package`, `signType`, `paySign`.

---

## 8. Mini Program design

### 8.1 App structure

- **Main package:** tab pages, search, product detail, core components, API client, store. Keep under the 2 MB main-package limit.
- **`packageOrder`:** checkout, address, order list/detail, logistics, aftersales, review.
- **`packageGrowth`:** group detail/list, bargain detail/list, flash sale, coupon center, referral.
- **`packageUser`:** favorites, history, my coupons, notifications, settings, agreements.
- **`packageSeller`:** optional; only if seller operations must be inside the Mini Program. Default recommendation is the web portal.
- Add `preloadRule` so product detail preloads `packageOrder` and `packageGrowth` on Wi-Fi; keep total package size within the current WeChat quota.
- Add a custom tab bar (`custom-tab-bar/`) for brand styling and a live cart badge. Keep `tabBar.list` in `app.json` even when `custom: true`; tab pages must stay in the main package.

### 8.2 Page map

| Route | Package | Purpose | Primary APIs |
|---|---|---|---|
| `pages/home/home` | Main | Feed, banners, categories, flash strip, group deals | `/home` |
| `pages/category/category` | Main | Left category tree + product grid | `/categories`, `/products` |
| `pages/cart/cart` | Main | Cart, selection, coupon hint, checkout bar | `/cart` |
| `pages/profile/profile` | Main | User card, order shortcuts, coupons, favorites, settings | `/me`, `/orders` |
| `pages/search/search` | Main | Hot words, suggestions, results, filters | `/search/*`, `/products` |
| `pages/goods/detail` | Main | Gallery, price, SKU sheet, reviews, shop, action bar | `/products/:id` |
| `packageOrder/pages/checkout` | Order | Address, coupon, price breakdown, submit | `/checkout/preview`, `/orders` |
| `packageOrder/pages/address-list` | Order | Address selection/management | `/addresses` |
| `packageOrder/pages/address-edit` | Order | Create/edit address | `/addresses` |
| `packageOrder/pages/order-list` | Order | Tabs: all, pending pay, to ship, shipped, completed, aftersales | `/orders` |
| `packageOrder/pages/order-detail` | Order | Status, items, price, actions, tracking | `/orders/:id` |
| `packageOrder/pages/logistics` | Order | Tracking timeline | `/orders/:id/logistics` |
| `packageOrder/pages/aftersales` | Order | Apply/view aftersales | `/orders/:id/after-sales` |
| `packageOrder/pages/review-create` | Order | Rating, text, image upload | `/orders/:id/reviews` |
| `packageGrowth/pages/group-detail` | Growth | Group status, invite, join | `/groups/:id` |
| `packageGrowth/pages/group-list` | Growth | My groups | `/me/groups` |
| `packageGrowth/pages/bargain-detail` | Growth | Bargain progress, invite, checkout | `/bargains/:id` |
| `packageGrowth/pages/bargain-list` | Growth | My bargains | `/me/bargains` |
| `packageGrowth/pages/flash-sale` | Growth | Session tabs, countdown, items | `/flash-sessions` |
| `packageGrowth/pages/coupon-center` | Growth | Claimable coupons | `/coupons` |
| `packageGrowth/pages/referral` | Growth | Invite code, stats, rewards | `/referral` |
| `packageUser/pages/favorites` | User | Favorite products | `/favorites` |
| `packageUser/pages/history` | User | Browse history | `/history` |
| `packageUser/pages/my-coupons` | User | Available/used/expired coupons | `/me/coupons` |
| `packageUser/pages/notifications` | User | In-app messages | `/notifications` |
| `packageUser/pages/settings` | User | Profile, privacy, about, logout | `/me` |

### 8.3 Shared components

Build in `miniprogram/components/` and reuse across packages:

- `nav-bar` — extend the existing `navigation-bar`: fix the missing `home` handler, add `title`, `back`, `transparent`, search slot, safe-area handling.
- `goods-card` — 2-column product card with image, title, price, sales, badges.
- `price` — fen-to-yuan formatting with small currency symbol and decimals.
- `countdown` — flash/group/bargain expiry; handles app background/foreground.
- `sku-sheet` — bottom sheet for SKU selection and quantity.
- `action-bar` — sticky bottom bar with safe-area padding.
- `quantity-stepper` — min/max/stock-aware.
- `coupon-card` — threshold, discount, validity, claim/use state.
- `address-card`, `order-card`, `status-timeline`, `share-button`, `image-uploader`, `rating`, `skeleton`, `empty-state`, `error-state`, `load-more`, `badge`, `tag`, `avatar`.

### 8.4 Data flow and state

- `services/request.ts` is the only place that calls `wx.request`.
  - Base URL from `config/env.ts`; attaches JWT; adds `X-Request-Id`; 10 s timeout.
  - On `401`, refresh once, then retry the queued requests; if refresh fails, clear session and silently re-login.
  - GET retries up to 2 times with exponential backoff; POST never auto-retries unless it carries a reused idempotency key.
  - Maps error codes to Chinese messages; preserves `requestId` for support.
  - Loading counter for global loading; per-page skeletons preferred over a blocking spinner.
- `store/` is a small typed observable store (no MobX dependency):
  - `userStore`: token, refresh token, profile, membership.
  - `cartStore`: count, selected amount, guest cart persistence.
  - `configStore`: env, tab bar badge, feature flags.
  - Pages subscribe/unsubscribe in `onLoad`/`onUnload`; persist only what is safe to persist.
- `types/api.gen.ts` is generated from OpenAPI in CI; hand-written UI types live in `types/ui.ts`.
- `utils/` adds `fenToYuan`, `yuanToFen`, `formatDate`, `debounce`, `throttle`, `buildSharePath`, `parseScene`, `ensureLogin`, `showError`, and validation helpers.

### 8.5 Authentication and profile

1. On launch, call `wx.login` and exchange the code at `POST /auth/wechat/login`. The server calls WeChat `jscode2session` with the AppID/secret and returns a JWT + refresh token.
2. Store tokens in `wx.setStorageSync`; never store `session_key` on the client.
3. Allow **guest browsing**; require login only for cart merge, checkout, growth actions, favorites, and profile.
4. `ensureLogin()` is called before protected actions. If the session is expired, refresh transparently; if that fails, re-run `wx.login`.
5. Profile completion uses `button open-type="chooseAvatar"` and `input type="nickname"` — replace the stock `wx.getUserProfile` flow.
6. Phone binding is optional for v1; use `getPhoneNumber` with a server-side phone-code exchange when required for high-value actions.
7. A shared/referral landing may arrive before login: persist the pending intent (`groupInstanceId`, `bargainId`, `inviterId`, `productId`) and resume after login.

### 8.6 Payment (mock) flow

1. Client calls `POST /orders` with an idempotency key.
2. Server returns an order in `PENDING_PAYMENT` with `expiresAt`.
3. Client calls `POST /orders/:id/mock-pay` with `{ outcome: "success" | "failure" }`; the endpoint is available **only** when `PAYMENT_MODE=mock` and the environment is not production.
4. Server writes a `payments` row, transitions the order, consumes/releases reservations, and updates group/flash/bargain state.
5. Client polls `GET /orders/:id` (or uses the response) and shows the result. Never simulate payment success purely on the client.
6. On app relaunch during payment, the order list shows the pending order and allows retry/cancel.

For real WeChat Pay later, implement a `PaymentProvider` interface with `createPayment`, `handleCallback`, `refund`, and `query`; add a `WechatPayProvider` using JSAPI and signed callbacks. The order/payment state machine should not change.

### 8.7 Sharing and deep links

- `onShareAppMessage` and `onShareTimeline` produce paths such as:
  - `/pages/goods/detail?id=...&inviter=...`
  - `/packageGrowth/pages/group-detail?id=...&inviter=...`
  - `/packageGrowth/pages/bargain-detail?id=...&inviter=...`
- Handle cold start in `App.onLaunch(options)`/`onShow(options)` and `wx.getLaunchOptionsSync()`; parse `scene` when present.
- Persist pending share context until login completes.
- Sharing must remain optional; do not gate rewards on mandatory sharing (see §14 platform risk).

### 8.8 Performance and UX rules

- Main package < 2 MB; growth/order/user pages in subpackages; `preloadRule` for likely next pages.
- Page size 20 for lists; cap in-memory items; use Skyline `scroll-view type="list"` where appropriate.
- Images from CDN with size/quality parameters; `lazy-load`; fixed aspect ratios to avoid layout shift; WebP where supported.
- Skeletons for first paint; empty/error/offline/retry states for every data page.
- Avoid large `setData` payloads; update nested fields by path; keep only UI state in `data`.
- Parallelize startup: do not block the home feed on login; guest browsing should paint immediately.
- Respect safe areas, custom navigation height, and the bottom tab bar/action bar.
- Add `App.onError` and `onUnhandledRejection` reporting.

---

## 9. Core flows and business rules

### 9.1 Cart → checkout → order

1. Add to cart validates SKU status/stock and merges duplicate lines.
2. Guest cart is local; after login, merge into the server cart with quantity caps and report invalid/removed items.
3. `POST /checkout/preview` recomputes prices, validates address/stock/coupons, and returns a breakdown.
4. `POST /orders` runs in a transaction:
   - Validate idempotency key.
   - Load SKUs with row locks; validate on-sale status and stock.
   - Reserve stock (DB reservation; Redis reservation for flash).
   - Recompute activity price, coupon discount, shipping, and total server-side.
   - Create order/order items with snapshots, lock coupon, create reservation.
   - Set `expiresAt` (15 minutes) and enqueue an auto-cancel job.
5. Mock payment succeeds → consume stock, consume coupon, order `PAID` → `TO_SHIP`; group orders remain in group-forming state until the group succeeds.
6. Timeout/cancel → release stock, coupon, group slot, flash reservation; order `CANCELLED`.
7. Duplicate taps return the same order due to the idempotency key; never create two orders.

**Edge cases:** price changed between preview and submit (`PRICE_CHANGED` with a new preview), stock exhausted, coupon invalid, missing address, app killed during payment, repeated payment callback.

### 9.2 Group buy (拼团)

- Activity defines product/SKU, group size, group price, validity window.
- Start or join creates a `group_instance` and a pending order; a group slot is **reserved** for 15 minutes.
- Payment converts the member to `PAID` and increments `paid_count`.
- When `paid_count >= required_count`, group `SUCCESS`, all member orders move to `TO_SHIP`.
- On expiry, group `FAILED`, unpaid reservations expire, paid members are auto-refunded (mock refund in v1), orders `REFUNDED`.
- Joining a full/expired group returns `GROUP_FULL`/`GROUP_EXPIRED` with a "start a new group" action.
- Demo mode may seed labeled virtual participants for presentations; production must not fabricate social proof.

### 9.3 Bargain (砍价)

- Activity defines start price, floor price, max cuts, validity.
- A user starts one active bargain per activity.
- A helper can cut once per bargain; the server chooses the cut amount within configured bounds and clamps to the floor. No self-cut; require login; rate-limit.
- When the floor is reached, status `READY`; user can checkout at the current price.
- Checkout locks the bargain instance to prevent reuse; payment completes the order.
- Expiry job marks `EXPIRED`; expired bargains cannot be ordered.
- Share text makes assistance optional; no forced share-to-continue.

### 9.4 Flash sale (限时秒杀)

- Sessions have start/end times; items have flash price, total stock, remaining stock, per-user limit.
- Show "not started", countdown, "buy now", and "sold out" states.
- Reservation uses a Redis Lua script to atomically check per-user limit and decrement remaining stock; writes `flash_reservations` with a 5–15 minute TTL.
- Order creation consumes the reservation; timeout/cancel returns stock.
- Periodically reconcile Redis and PostgreSQL; DB `stock_remaining >= 0` is the final guard.
- Load-test with concurrent buyers before release.

### 9.5 Coupons

- Types: platform-wide, shop, product; amount-off or percentage with a cap; threshold; validity window; total and per-user limits.
- Claim is idempotent per user/coupon within the limit.
- Checkout chooses the best valid coupon by default; user can switch.
- Order creation locks the coupon claim (`LOCKED` + `order_id`); payment marks `USED`; cancel/timeout returns `AVAILABLE`; expiry marks `EXPIRED`.
- Prevent stacking unless explicitly configured. Coupon rules are server-authoritative and unit-tested.

### 9.6 Referral

- Share links carry `inviter=<userId>` (or a signed invite code).
- A new user binds to one inviter; self-invite and existing-user rebinding are rejected.
- Reward (coupon/points) is granted after the invitee's first paid order, not at signup.
- No multi-level rewards; cap rewards per inviter per period; record attribution for analytics.

### 9.7 Reviews, favorites, history, notifications

- Reviews are allowed only for completed order items; one review per item; images are moderated before publication.
- Favorites/history are per user; history upserts and caps stored entries.
- Notifications cover group success/failure, shipment, refund, coupon expiry, and aftersales updates.
- Request WeChat subscription messages only after an explicit user action and only for the relevant event.

### 9.8 Aftersales

- v1: refund-only and return/refund requests with reason, description, images, and status (`PENDING`, `APPROVED`, `REJECTED`, `REFUNDED`, `CLOSED`).
- Admin approval triggers a mock refund and updates the order/refund records.
- Enforce order-state and time-window rules; prevent duplicate open requests.
- Include a clear aftersales policy page for review compliance.

---

## 10. Backend implementation details

### 10.1 Modules

`auth`, `users`, `catalog`, `cart`, `pricing`, `orders`, `payments`, `inventory`, `coupons`, `growth` (group/bargain/flash/referral), `reviews`, `notifications`, `uploads`, `admin`, `health`.

### 10.2 Transaction and concurrency rules

- Use Prisma interactive transactions for order creation, payment confirmation, group join, bargain cut, and coupon lock.
- Use `SELECT ... FOR UPDATE` (or Prisma row locks) when reading stock/group state inside a transaction.
- Add DB check constraints: `stock_available >= 0`, `stock_reserved >= 0`, `stock_sold >= 0`, `stock_remaining >= 0`, `paid_count <= required_count`.
- Use Redis Lua for flash-sale stock/per-user limits; reconcile with PostgreSQL asynchronously.
- BullMQ delayed jobs: order timeout, group expiry, bargain expiry, flash reservation expiry, coupon expiry, notification retries.
- Every job is idempotent and safe to retry.

### 10.3 Payment provider abstraction

```ts
interface PaymentProvider {
  createPayment(order: Order): Promise<PaymentDescriptor>;
  handleCallback(payload: unknown): Promise<PaymentResult>;
  refund(refund: Refund): Promise<RefundResult>;
  query(order: Order): Promise<PaymentStatus>;
}
```

- `MockPaymentProvider`: dev/staging only; requires `PAYMENT_MODE=mock` and `NODE_ENV !== 'production'`; server rejects the endpoint otherwise.
- `WechatPayProvider`: future; JSAPI order, signed callback verification, refund, query.
- Payment records are append-only; a successful payment is unique per order.
- Real payment release gate: checkout is disabled in production unless a real provider is configured.

### 10.4 Security controls

- JWT access token (short-lived) + rotating refresh token; never put secrets in the Mini Program.
- Validate every DTO with `class-validator`; whitelist unknown fields.
- Enforce ownership on all reads/writes; never accept `userId` from the client.
- Rate-limit login, coupon claim, bargain cut, order creation, uploads, and admin login.
- Validate upload MIME/size; scan/moderate images; store with random keys; serve from CDN.
- Sanitize rich text/product descriptions; use structured description blocks where possible.
- Admin: password hashing (Argon2/bcrypt), RBAC guard, audit logs, optional 2FA, IP allowlist in production.
- Idempotency keys stored with a unique constraint and request hash; reject reuse with different payloads.
- CORS restricted to the admin origin; API does not need browser CORS for the Mini Program.
- Secrets in environment variables/secret manager; `.env` never committed.
- Add security headers at the reverse proxy; force HTTPS.

### 10.5 Observability

- Structured JSON logs with `requestId`, `userId`, `orderId`, latency.
- Health endpoints: `/health/live`, `/health/ready` (DB, Redis, storage).
- Metrics: request rate, p95 latency, error rate, order conversion, payment failures, stock conflicts, job failures.
- Error tracking (Sentry or equivalent) for API, admin, and Mini Program.
- Alerts for 5xx spikes, payment/webhook failures, queue backlog, and stock reconciliation mismatches.
- Daily database backups; test restore before release.

---

## 11. Admin/seller portal

- **Stack:** React + Vite + Ant Design; separate SPA served over HTTPS.
- **Auth:** email/password login; JWT; roles `ADMIN` and `SELLER`; seller scoped to its `shop_id`.
- **Screens:**
  - Dashboard: sales, orders, conversion, pending shipment, low stock.
  - Products: list, create/edit, images, SKU matrix, inventory adjustment.
  - Orders: filter, detail, ship (carrier + tracking number), refund approval.
  - Campaigns: group activities, bargain activities, flash sessions, coupons; schedule and status.
  - Shops/categories (admin only).
  - Users/orders oversight (admin only).
  - Audit logs.
- **Guardrails:** price/stock validation, publish/unpublish confirmation, optimistic locking or version checks to avoid overwriting concurrent edits.
- **Testing:** Playwright for login, product creation, campaign creation, shipping, refund.

If seller operations must live inside the Mini Program, add a hidden `packageSeller` with the same APIs; estimate +5–7 days and additional review/compliance work.

---

## 12. UI/UX and design system

### 12.1 Brand direction

- PDD-inspired but distinct: energetic red/orange, dense product grids, strong price emphasis, deal badges, friendly Chinese copy.
- Suggested tokens:
  - Primary: `#E02E24`; accent: `#FF7A00`; price: `#E02E24`.
  - Background: `#F5F5F5`; card: `#FFFFFF`; text: `#1A1A1A`; secondary: `#666666`; muted: `#999999`.
  - Success: `#07C160`; warning: `#FF976A`; border: `#EEEEEE`.
  - Spacing grid: 8rpx; card radius: 16rpx; page padding: 24rpx; tap targets ≥ 44px.
- Centralize tokens in `miniprogram/styles/tokens.less` and CSS custom properties; import from `app.less`.
- Use local PNG/WebP icons or an icon font; avoid remote font dependencies.

### 12.2 Key UI patterns

- Home: search bar in custom nav, banner carousel, category icons, flash-sale countdown strip, "拼团热卖" 2-column grid.
- Product card: square image, 2-line title, price with large integer, sales count, group/deal badge.
- Product detail: swiper gallery, price block, group/bargain entry cards, SKU row, shop card, review preview, sticky action bar (`客服`, `收藏`, `加入购物车`, `立即购买`).
- Checkout: address card, item list, coupon row, price breakdown, agreement checkbox, sticky pay bar.
- Orders: status tabs, order cards with item snapshots and action buttons, status timeline.
- Growth: progress rings/bars for group/bargain, countdowns, avatar stacks, share CTA, clear rules link.
- Empty/error states: friendly illustration/text, retry button, and a path back to home.

### 12.3 Compliance copy

- Show promotion rules (`活动规则`) for group/bargain/flash/coupons.
- Show price, discount, shipping, and final payable amount clearly.
- Do not use fake countdowns, fake stock, or fabricated "xx人正在拼单" in production.
- Provide privacy policy, user agreement, aftersales policy, and customer-service entry.

---

## 13. Testing and quality

### 13.1 Backend

- Unit tests: pricing, coupon eligibility, order state machine, group/bargain/flash rules, idempotency.
- Integration tests with real PostgreSQL/Redis (Docker) for transactions, constraints, and jobs.
- API contract tests: OpenAPI schema validation; generated client types must compile.
- Idempotency tests: repeated order/pay/refund/cut requests produce one effect.
- Concurrency tests: parallel orders on the last stock item; parallel group joins; parallel coupon claims.
- Security tests: IDOR, price tampering, JWT tampering, replay, mock-pay in production, upload abuse.
- Load test: flash sale with 1,000 concurrent buyers; verify no oversell and acceptable p95.

### 13.2 Mini Program

- `miniprogram-automator` smoke suite:
  - Guest browse → product detail → share.
  - Login → add to cart → checkout preview → mock pay → order detail.
  - Group start/join → success and expiry.
  - Bargain start → helper cut → checkout.
  - Flash sale → sold out/limit.
  - Coupon claim → use → cancel releases coupon.
  - 401 refresh, offline/error retry, cold-start share link.
- Manual device matrix: iOS 16/17, Android 12/13, current WeChat, DevTools; test both Skyline and WebView fallback if enabled.
- Visual checks at common widths; safe-area checks on notched devices.
- Package-size check in CI (`miniprogram-ci` preview) and main-package budget alert.

### 13.3 Admin

- Playwright: login/RBAC, product/SKU creation, stock update, campaign creation, order shipping, refund approval.
- Permission tests: seller cannot access another shop's data; seller cannot access platform admin pages.

### 13.4 Quality gates

- `tsc --noEmit`, ESLint, Prettier, backend tests, admin build, OpenAPI diff, Mini Program typecheck.
- No P0/P1 defects open at release.
- All critical paths pass on a real device, not only DevTools.

---

## 14. Security, compliance, and platform risk

### 14.1 WeChat platform risk (important)

PDD-style **bargain/group sharing can be reviewed as诱导分享/诱导关注** if rewards require sharing or if the flow pressures users to share. WeChat's platform rules are stricter than PDD's historical growth playbook.

Mitigations:

- Make sharing **optional**; never gate a reward or order on a share action.
- Do not require following an official account.
- Do not use "share to unlock", "invite N friends or fail", or misleading progress.
- Clearly disclose activity rules, limits, and expiry.
- Use compliant share cards; avoid exaggerated or misleading claims.
- Keep a feature-flagged fallback: if review risk is high, ship group buy + coupons first and defer bargain.
- Have the promotion copy and mechanics reviewed before submission.

### 14.2 Commerce compliance

- E-commerce category qualification and business license for the Mini Program.
- ICP filing for the API domain; HTTPS; whitelisted request/upload/download domains.
- Privacy policy, user agreement, aftersales/return policy, and a clear complaints channel.
- Minimal PII collection; mask phone/address in logs; support account/data deletion.
- 7-day no-reason return and consumer-rights rules for applicable categories.
- No multi-level distribution/MLM; referral rewards are single-level and capped.
- Real payment requires an approved WeChat Pay merchant account; do not ship mock payment to real users.

### 14.3 Technical security checklist

- [ ] Server-side price/stock/coupon authority; no trust in client totals.
- [ ] Ownership checks on every user resource.
- [ ] Idempotency on all money/stock mutations.
- [ ] Mock payment hard-disabled in production.
- [ ] JWT rotation and revocation; secure storage; no secrets in client code.
- [ ] Rate limits and anti-abuse on growth actions.
- [ ] Upload validation and content moderation.
- [ ] Admin RBAC, audit logs, strong password hashing.
- [ ] HTTPS, security headers, dependency scanning, secret scanning.
- [ ] Backups and restore drill.

---

## 15. Delivery plan

### 15.1 Phase overview

| Phase | Focus | Estimate | Exit gate |
|---|---|---:|---|
| 0 | Foundations and API contract | 4–5 days | Local stack runs; Mini Program calls health/login; CI green. |
| 1 | Buyer shell and catalog | 6–8 days | Guest can browse, search, view product, favorite, share. |
| 2 | Cart, checkout, orders | 6–8 days | End-to-end mock purchase; timeout/idempotency correct. |
| 3 | Growth mechanics | 10–12 days | Group, bargain, flash, coupons, referral work with expiry/refund. |
| 4 | Admin/seller and support | 8–10 days | Ops can create products/campaigns and ship orders. |
| 5 | Hardening and release | 6–8 days | DoD and release checklist pass. |

**Total:** 40–51 person-days + ~20% buffer ≈ **10–12 weeks solo full-time**. Part-time study pace: **4–5 months**.

### 15.2 Phase details

#### Phase 0 — Foundations and contract (4–5 days)

- Initialize Git; add `.gitignore`, `.editorconfig`, `.nvmrc` (Node 22).
- Add `server/` NestJS scaffold, Prisma schema baseline, Docker Compose (Postgres 16, Redis 7, MinIO), health endpoints, Swagger, env validation.
- Add `admin/` Vite scaffold and shared API client.
- Mini Program: `config/env.ts`, `services/request.ts`, auth service, error mapping, `types/api.gen.ts` generation, design tokens, base components (`price`, `empty-state`, `skeleton`, `load-more`).
- Fix `navigation-bar` missing `home` handler; decide Skyline vs WebView; verify base library.
- Replace stock pages with initial route structure and custom tab bar.
- CI: lint, typecheck, tests, OpenAPI export, build.
- Docs: architecture, API conventions, runbook.

**Exit:** `docker compose up` gives a healthy API; DevTools can call `/health` and login; `tsc --noEmit` passes; no stock demo pages remain.

#### Phase 1 — Buyer shell and catalog (6–8 days)

- Backend: categories, banners, products/SKUs, search, reviews read, favorites, history, seed data.
- Mini Program: home, category, search, product list, product detail, favorites, history, share, skeletons/empty/error.
- Custom tab bar with cart badge placeholder; image CDN; pagination.
- Seed 5 categories, 3 shops, 30 products, 100 SKUs, banners, reviews.

**Exit:** Guest can browse the full catalog on a real device; share a product; main package under 2 MB.

#### Phase 2 — Cart, checkout, orders (6–8 days)

- Backend: cart, address CRUD, pricing preview, order creation, inventory reservation, mock payment, order timeout job, cancel/confirm, logistics mock, aftersales skeleton, review creation.
- Mini Program: cart, address list/edit, checkout, order list/detail, payment result, logistics, review form.
- Idempotency, price-change handling, coupon placeholder integration, guest-cart merge.

**Exit:** Full purchase flow works; duplicate taps create one order; tampered prices are rejected; timeout releases stock; order states are consistent after app restart.

#### Phase 3 — Growth mechanics (10–12 days)

- Backend: group activities/instances/members; bargain activities/instances/cuts; flash sessions/items/reservations; coupons; referral; notifications; subscription messages; image moderation.
- Mini Program: group detail/list, bargain detail/list, flash sale, coupon center/my coupons, referral, notification center; share card variants.
- Jobs: group expiry/refund, bargain expiry, flash reservation expiry, coupon expiry.
- Load test flash sale; anti-abuse checks.

**Exit:** Each mechanic has happy path, expiry/cancel/refund path, share cold-start path, and abuse guard; flash load test shows no oversell.

#### Phase 4 — Admin/seller and support (8–10 days)

- Admin: auth/RBAC, dashboard, product/SKU/stock, orders/shipping, campaigns, coupons, refunds, audit logs.
- Seller scoping; admin API tests.
- Customer service entry (`open-type="contact"` / `wx.openCustomerServiceChat`); template-message configuration.
- Optional in-app IM only if explicitly required; otherwise keep customer service.

**Exit:** Operations can launch a product and campaign without editing the database; shipping updates the buyer; seller data isolation verified; admin actions audited.

#### Phase 5 — Hardening and release (6–8 days)

- Security review, IDOR/replay/price-tamper tests, rate limits, secret scan.
- Performance: startup, first render, p95 API latency, package size, image optimization.
- Full device matrix and Mini Program automation.
- Privacy/terms/rules pages, category qualification, domain whitelist, monitoring, backups.
- Release checklist and gray-release plan.

**Exit:** Definition of Done in §17 passes; production payment gate is enforced.

### 15.3 Critical path

`Phase 0 API contract` → `Phase 1 catalog` → `Phase 2 order/payment` → `Phase 3 growth` → `Phase 4 admin` → `Phase 5 release`.

Do not start growth UI before the order/payment state machine and idempotency are stable; every growth mechanic ultimately creates an order.

### 15.4 Reduced demo cut (if time is tight)

A presentable course/demo build in ~4–5 weeks:

- Phase 0 + Phase 1 + Phase 2.
- Group buy only (the most recognizable PDD feature) + coupons.
- Seed data and mock payment; admin via seed scripts instead of a full portal.
- Defer bargain, flash sale, referral, full admin, and in-app IM.

This keeps the core "browse → group → pay → order" story intact while reducing risk.

---

## 16. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Full PDD scope is too large | High | Schedule slip | Phase gates; demo cut; feature flags; build order/payment first. |
| WeChat review rejects bargain/group sharing | Medium | Feature removed/delayed | Optional sharing, no forced rewards, rules disclosure, fallback to group + coupons. |
| Mock payment accidentally shipped | Low | Free orders / fraud | Environment guard + server check + release gate; production checkout disabled without real payment. |
| Flash-sale oversell | Medium | Refunds/complaints | Redis Lua + DB constraints + reservations + load test. |
| Skyline/base-library incompatibility | Medium | Rendering bugs | Verify in Phase 0; per-page WebView fallback; test real devices. |
| Main package exceeds 2 MB | Medium | Cannot upload | Subpackages, CDN images, no heavy runtime deps, CI size check. |
| API domain/ICP delay | Medium | Cannot test on device/trial | Start domain/ICP early; use DevTools locally; staging domain. |
| Seller scope creep | High | Delay | Ship admin/seller portal first; defer in-app seller center. |
| Coupon/stock race conditions | Medium | Financial loss | Transactions, locks, unique constraints, idempotency, concurrency tests. |
| Fake social proof or misleading UI | Medium | Review rejection/legal risk | No fake counts/timers in production; label demo data. |
| Content moderation gaps | Medium | Review rejection | Use WeChat security APIs and server-side checks for reviews/uploads. |
| Admin account compromise | Low | Data breach | RBAC, strong hashing, 2FA optional, rate limits, audit logs, IP allowlist. |

---

## 17. Definition of Done and release checklist

### 17.1 Functional DoD

- [ ] Guest browse, search, category, product detail, share.
- [ ] Silent login; profile completion via avatar/nickname; session refresh.
- [ ] Cart add/update/remove/select; guest cart merge.
- [ ] Address CRUD and default address.
- [ ] Checkout preview with server-side price, coupon, and shipping.
- [ ] Order creation with idempotency; mock pay success/failure; timeout cancel.
- [ ] Order list/detail, cancel, confirm receipt, logistics timeline.
- [ ] Group buy: start, join, share, success, expiry/refund.
- [ ] Bargain: start, helper cut, floor, expiry, checkout.
- [ ] Flash sale: countdown, per-user limit, sold out, reservation release.
- [ ] Coupons: claim, use, release on cancel.
- [ ] Referral: bind, first-order reward, anti-self-invite.
- [ ] Reviews with images and moderation.
- [ ] Aftersales request and admin approval/refund.
- [ ] Admin: product/SKU/stock, campaign, ship, refund, dashboard, audit.
- [ ] Customer-service entry.

### 17.2 Non-functional DoD

- [ ] `tsc --noEmit`, lint, backend tests, admin build, Mini Program automation pass.
- [ ] No P0/P1 defects; critical paths tested on iOS and Android real devices.
- [ ] Home first meaningful render < 2 s on a typical 4G device; API p95 < 300 ms for browse.
- [ ] Flash sale load test: 1,000 concurrent buyers, no oversell.
- [ ] Main package < 2 MB; total package within WeChat's current quota.
- [ ] Security checklist in §14.3 complete.
- [ ] OpenAPI published; seed and runbook documented.
- [ ] Backups and restore verified; monitoring/alerts active.
- [ ] Privacy policy, user agreement, promotion rules, aftersales policy published.
- [ ] Request/upload/download domains whitelisted; HTTPS valid.
- [ ] Production payment gate verified; mock pay returns 404/403 in production.
- [ ] Gray release and rollback plan ready.

---

## 18. Open decisions and next steps

### 18.1 Decisions to confirm before implementation

1. **Backend stack:** confirm Node 22 + NestJS + PostgreSQL + Redis. If a backend already exists, share its API and we will map this contract onto it.
2. **Seller surface:** admin web portal with seller role (recommended) vs. seller pages inside the Mini Program.
3. **Chat:** WeChat customer service only (recommended for v1) vs. full in-app buyer-seller IM.
4. **Deadline:** full 10–12 week build vs. 4–5 week demo cut.
5. **Brand assets:** logo, colors, product images, shop names; otherwise use placeholders.
6. **Infrastructure:** cloud provider, domain, ICP status, object storage (COS/OSS), and whether a WeChat Pay merchant account is planned.
7. **Compliance:** target category/business license status; whether bargains are acceptable under the review strategy.

### 18.2 Recommended first three PRs

1. `chore(server): scaffold NestJS + Prisma + Docker Compose + health + OpenAPI`
2. `feat(miniprogram): replace stock demo with app shell, env config, request layer, tab bar, design tokens`
3. `feat(catalog): home/category/search/product detail read path + seed data`

### 18.3 Immediate task order

1. Confirm the decisions above.
2. Resolve Skyline/base-library compatibility and Git initialization.
3. Lock the OpenAPI contract for auth, catalog, cart, checkout, orders, and mock payment.
4. Build Phase 0 and Phase 1; demo on a real device early.
5. Build Phase 2 before any growth UI.
6. Add growth mechanics behind feature flags, then admin, then hardening.
7. Run the release checklist with a real-device test pass.

---

## Appendix A — Environment variables

**Server**

```text
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
WX_APPID=...
WX_SECRET=...
PAYMENT_MODE=mock                 # mock | wechat
STORAGE_ENDPOINT=...
STORAGE_BUCKET=...
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
ADMIN_ORIGIN=http://localhost:5173
SENTRY_DSN=...
```

**Mini Program** (`config/env.ts`)

```text
develop  -> http://localhost:3000
trial    -> https://api-staging.example.com
release  -> https://api.example.com
```

**Admin**

```text
VITE_API_BASE_URL=https://api.example.com/api/v1
```

Never commit `.env`, WeChat secrets, JWT secrets, storage keys, or the Mini Program CI private key.

---

## Appendix B — Seed data

`server/prisma/seed.ts` should create, only in non-production:

- 5 top-level categories and 10 subcategories.
- 3 shops with logos and descriptions.
- 30 products, 100 SKUs, realistic prices/stock, images.
- Home banners and a flash-session fixture.
- One group activity, one bargain activity, one flash item, and platform/shop coupons.
- Demo buyer, seller, and admin accounts.
- A few completed orders/reviews for UI testing, clearly marked as demo data.

Do not seed fake reviews, fake sales counts, or fake "people are buying" signals into production.

---

## Appendix C — Suggested first sprint checklist

- [ ] Git init + `.gitignore` + `.nvmrc`
- [ ] Docker Compose: Postgres, Redis, MinIO
- [ ] NestJS health endpoint + Swagger
- [ ] Prisma baseline schema + migration + seed
- [ ] OpenAPI export script + `api.gen.ts`
- [ ] Mini Program env config + request wrapper + auth service
- [ ] Replace `pages/index` and `pages/logs`
- [ ] Custom tab bar + nav-bar fix
- [ ] Design tokens + `price`/`empty-state`/`skeleton` components
- [ ] Home/category/product detail read path
- [ ] CI: lint, typecheck, tests, build
- [ ] README + runbook
