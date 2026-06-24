# shopify-webhook-demo

> Shopify Admin API integration — OAuth install flow, HMAC-verified webhook receiver, and order creation in Node.js + TypeScript.

## What It Does

Demonstrates three core patterns for building production Shopify integrations:

1. **Order creation** via the Shopify Admin REST API — authenticated, structured payload, error-handled
2. **Webhook receiver** — listens for `orders/create` events, verifies the HMAC-SHA256 signature before processing
3. **Client abstraction** — typed `ShopifyClient` wrapping the Admin API; drop-in for any Shopify integration

## Business Problem Solved

Merchants using third-party fulfillment platforms, ERPs, or custom storefronts need to push/pull order data with Shopify reliably. This pattern underpins any Shopify-connected app: POS sync, wholesale ordering, 3PL integrations, custom checkout flows.

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 |
| Language | TypeScript |
| HTTP server | Node `http` (zero deps for webhook receiver) |
| Shopify API | Admin REST API 2024-01 |
| Auth | HMAC-SHA256 webhook verification, Access Token header |

## Architecture

```
Shopify Store
     │
     │  POST orders/create webhook
     ▼
┌─────────────────────┐
│  webhook-server.ts  │
│  :3000/webhooks/    │
│  orders             │
│                     │
│  1. Verify HMAC     │
│  2. Parse payload   │
│  3. Process order   │
└─────────────────────┘
          │
          ▼
  Your DB / downstream
  (fulfillment, ERP, etc.)
```

```
Your App
   │
   │  createOrder(payload)
   ▼
ShopifyClient (shopify-client.ts)
   │
   │  POST /admin/api/2024-01/orders.json
   │  X-Shopify-Access-Token: <token>
   ▼
Shopify Admin API
```

## Setup

```bash
git clone https://github.com/dalerks/shopify-webhook-demo
cd shopify-webhook-demo
npm install
```

Copy `.env.example` to `.env`:

```env
SHOPIFY_SHOP=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
PORT=3000
```

### Run the webhook server

```bash
npm run webhook
# Webhook server listening on :3000
```

### Create an order via the API

```typescript
import { ShopifyClient } from "./src/shopify-client";

const client = new ShopifyClient({
  shop: process.env.SHOPIFY_SHOP!,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
});

const { order } = await client.createOrder({
  order: {
    line_items: [{ title: "Widget", quantity: 1, price: "29.99" }],
    financial_status: "pending",
  },
});

console.log("Created order:", order.id);
```

### Register the webhook with Shopify

```bash
curl -X POST https://your-store.myshopify.com/admin/api/2024-01/webhooks.json \
  -H "X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"webhook":{"topic":"orders/create","address":"https://your-server.com/webhooks/orders","format":"json"}}'
```

## Project Structure

```
src/
├── shopify-client.ts    # Typed Admin API client (order CRUD, signature verify)
└── webhook-server.ts    # HMAC-verified webhook receiver
```
