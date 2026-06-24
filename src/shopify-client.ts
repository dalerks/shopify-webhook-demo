import crypto from "crypto";

export interface ShopifyConfig {
  shop: string;
  accessToken: string;
  apiVersion?: string;
}

export interface OrderLineItem {
  variant_id?: number;
  product_id?: number;
  title: string;
  quantity: number;
  price: string;
  sku?: string;
  properties?: Array<{ name: string; value: string }>;
}

export interface CreateOrderPayload {
  order: {
    line_items: OrderLineItem[];
    customer?: { id?: number; first_name?: string; last_name?: string; email?: string };
    billing_address?: Record<string, string>;
    shipping_address?: Record<string, string>;
    financial_status?: string;
    tags?: string;
    note?: string;
  };
}

export class ShopifyClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(private config: ShopifyConfig) {
    const version = config.apiVersion ?? "2024-01";
    this.baseUrl = `https://${config.shop}/admin/api/${version}`;
    this.headers = {
      "X-Shopify-Access-Token": config.accessToken,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async createOrder(payload: CreateOrderPayload) {
    const res = await fetch(`${this.baseUrl}/orders.json`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Shopify API error ${res.status}: ${err}`);
    }
    return res.json();
  }

  async getOrders(params?: Record<string, string>) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await fetch(`${this.baseUrl}/orders.json${query}`, { headers: this.headers });
    if (!res.ok) throw new Error(`Shopify API error ${res.status}`);
    return res.json();
  }

  verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    const hash = crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  }
}
