// Local DeepSeek Flash spending guard. Integer micro-yuan avoids rounding down.
// Peak/cache-miss prices checked against DeepSeek's CNY pricing on 2026-10-11.
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";

export const LIMIT = 10_000_000;
export const INPUT_RATE = 2;
export const OUTPUT_RATE = 8;
const DAY = 86_400_000;
export interface Chat { model: string; messages: Array<{ role: string; content: string }>; max_tokens: number; temperature?: number; response_format?: unknown; thinking?: { type: string }; }

export function reserveCost(body: Chat): number {
  if (body.model !== "deepseek-flash" || !Number.isInteger(body.max_tokens) || body.max_tokens < 1 || body.max_tokens > 16384) throw new Error("Only deepseek-flash with 1–16384 output tokens is allowed");
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 8 || body.messages.some(m => !["system", "user", "assistant"].includes(m.role) || typeof m.content !== "string")) throw new Error("Only text chat messages are allowed");
  if (Object.keys(body).some(k => !["model", "messages", "max_tokens", "temperature", "response_format", "thinking"].includes(k)) || body.thinking?.type !== "disabled") throw new Error("Unsupported request options; thinking must be disabled");
  // Byte-level tokenization cannot produce more text tokens than UTF-8 bytes.
  // Reserve an additional 1024 tokens per message plus 1024 for the chat template.
  const input = Buffer.byteLength(JSON.stringify(body.messages), "utf8") + (body.messages.length + 1) * 1024;
  if (input > 1_000_000) throw new Error("Input exceeds the guarded context limit");
  return input * INPUT_RATE + body.max_tokens * OUTPUT_RATE;
}

export class Ledger {
  readonly db: DatabaseSync;
  constructor(file: string) {
    this.db = new DatabaseSync(file, { timeout: 5000 });
    this.db.exec("CREATE TABLE IF NOT EXISTS calls(id TEXT PRIMARY KEY, state TEXT NOT NULL, reserved INTEGER NOT NULL, charged INTEGER NOT NULL, finished_at INTEGER)");
  }
  total(now = Date.now()): number {
    return Number((this.db.prepare("SELECT coalesce(sum(CASE WHEN state!='settled' THEN reserved ELSE charged END),0) AS total FROM calls WHERE state!='settled' OR finished_at > ?").get(now - DAY) as { total: number }).total);
  }
  reserve(amount: number, now = Date.now()): string | null {
    if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("Invalid reservation");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      if (this.db.prepare("SELECT 1 FROM calls WHERE state='blocked' LIMIT 1").get() || this.total(now) + amount > LIMIT) { this.db.exec("ROLLBACK"); return null; }
      const id = randomUUID();
      this.db.prepare("INSERT INTO calls VALUES (?,'pending',?,0,NULL)").run(id, amount);
      this.db.exec("COMMIT");
      return id;
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }
  settle(id: string, usage: unknown, now = Date.now()): void {
    const row = this.db.prepare("SELECT reserved,state FROM calls WHERE id=?").get(id) as { reserved: number; state: string } | undefined;
    if (!row || row.state !== "pending") throw new Error("Reservation is not pending");
    const u = usage as { prompt_tokens?: number; completion_tokens?: number } | null;
    if (!u || !Number.isSafeInteger(u.prompt_tokens) || !Number.isSafeInteger(u.completion_tokens) || u.prompt_tokens! < 0 || u.completion_tokens! < 0) return; // missing usage keeps the full reservation
    const charged = u.prompt_tokens! * INPUT_RATE + u.completion_tokens! * OUTPUT_RATE;
    if (!Number.isSafeInteger(charged) || charged > row.reserved) {
      this.db.prepare("UPDATE calls SET state='blocked' WHERE id=?").run(id);
      throw new Error("Provider usage exceeded the reserved bound; stop and inspect pricing/token limits");
    }
    this.db.prepare("UPDATE calls SET state='settled',charged=?,finished_at=? WHERE id=? AND state='pending'").run(charged, now, id);
  }
  close() { this.db.close(); }
}
