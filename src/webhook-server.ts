import http from "http";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET ?? "";
const PORT = process.env.PORT ?? 3000;

function verifySignature(rawBody: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/webhooks/orders") {
    res.writeHead(404).end();
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    const signature = req.headers["x-shopify-hmac-sha256"] as string;

    if (!verifySignature(body, signature)) {
      console.warn("Webhook signature verification failed");
      res.writeHead(401).end("Unauthorized");
      return;
    }

    const payload = JSON.parse(body);
    console.log(`[webhook] order/${payload.id} received — status: ${payload.financial_status}`);

    // Process order here: write to DB, trigger fulfillment, send notification, etc.

    res.writeHead(200).end("OK");
  });
});

server.listen(PORT, () => console.log(`Webhook server listening on :${PORT}`));
