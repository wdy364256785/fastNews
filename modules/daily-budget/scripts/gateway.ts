// Bind only to localhost. Paid calls still originate in the engine's receipt layer.
import http from "node:http";
import { timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { Ledger, reserveCost, LIMIT, type Chat } from "../ledger.ts";
const key = process.env.LLM_API_KEY;
if (!key) throw new Error("LLM_API_KEY is required");
const dir = resolve(process.env.AIHOT_DATA_DIR ?? ".data");
mkdirSync(dir, { recursive: true, mode: 0o700 });
const ledger = new Ledger(resolve(dir, "deepseek-budget.sqlite"));
let stopped = false;
const server = http.createServer(async (req, res) => {
  const auth = Buffer.from(req.headers.authorization ?? "");
  const expected = Buffer.from(`Bearer ${key}`);
  const send = (status: number, body: unknown) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
  if (auth.length !== expected.length || !timingSafeEqual(auth, expected)) return send(401, { error: { message: "Unauthorized" } });
  if (req.method !== "POST" || req.url !== "/v1/chat/completions") return send(404, { error: { message: "Not found" } });
  if (stopped) return send(402, { error: { message: "Budget guard stopped; operator inspection required" } });
  let body: Chat;
  try {
    const chunks: Buffer[] = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 1_500_000) throw new Error("Request too large"); chunks.push(chunk); }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const amount = reserveCost(body);
    const id = ledger.reserve(amount);
    if (!id) return send(429, { error: { message: "Rolling 24-hour CNY 10 budget exhausted" } });
    // Never follow a redirect with the credential. No upstream retry: the receipt handles recovery.
    const upstream = await fetch("https://api.deepseek.com/v1/chat/completions", { method: "POST", redirect: "error", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(110_000) });
    const text = await upstream.text();
    if (upstream.ok) {
      try { ledger.settle(id, JSON.parse(text).usage); }
      catch { stopped = true; } // retain the reservation; fail closed on a bound violation
    }
    // Refusals/unknown outcomes keep their full reservation until reviewed.
    res.writeHead(upstream.status, { "content-type": "application/json" }); res.end(text);
    console.log(JSON.stringify({ event: "model_request", status: upstream.status, guardedCny: ledger.total() / 1e6, stopped }));
  } catch {
    send(502, { error: { message: "Budgeted upstream request failed; reservation retained" } });
  }
});
server.listen(3002, "127.0.0.1", () => console.log(JSON.stringify({ event: "budget_gateway_started", port: 3002, limitCny: LIMIT / 1e6 })));
