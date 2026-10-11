import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Ledger, reserveCost, LIMIT, type Chat } from "../ledger.ts";
const chat: Chat = { model: "deepseek-flash", messages: [{ role: "user", content: "中文财经新闻" }], max_tokens: 1024, thinking: { type: "disabled" } };
test("only bounded text non-thinking requests can reach the paid service", () => {
  assert.ok(reserveCost(chat) > 1024 * 8);
  for (const bad of [{...chat,model:"deepseek-v4-pro"},{...chat,max_tokens:384000},{...chat,thinking:{type:"enabled"}},{...chat,stream:true},{...chat,messages:[{role:"user",content:[]}] }]) assert.throws(() => reserveCost(bad as Chat));
});
test("two connections cannot reserve beyond the money limit, and restart preserves pending spending", () => {
  const dir=mkdtempSync(join(tmpdir(),"budget-"));const file=join(dir,"guard.sqlite");const a=new Ledger(file),b=new Ledger(file);
  try { const first=a.reserve(6_000_000)!;assert.ok(first);assert.equal(b.reserve(4_000_001),null);assert.ok(b.reserve(4_000_000));assert.equal(a.total(),LIMIT);assert.equal(a.reserve(1),null); }
  finally {a.close();b.close();}
  const recovered=new Ledger(file);try{assert.equal(recovered.total(),LIMIT);assert.equal(recovered.reserve(1),null);}finally{recovered.close();rmSync(dir,{recursive:true});}
});
test("settlement frees only verified usage; missing/invalid usage and unknown calls stay reserved", () => {
  const l=new Ledger(":memory:");try { const id=l.reserve(100_000,0)!;l.settle(id,null,1);assert.equal(l.total(1),100_000);l.settle(id,{prompt_tokens:1000,completion_tokens:1000},2);assert.equal(l.total(2),10_000);assert.equal(l.total(86_400_003),0);const unknown=l.reserve(100_000,0)!;assert.ok(unknown);assert.equal(l.total(2*86_400_000),100_000); }finally{l.close();}
});
test("unexpected usage keeps the reservation and raises an error", () => {const l=new Ledger(":memory:");try{const id=l.reserve(100)!;assert.throws(()=>l.settle(id,{prompt_tokens:100,completion_tokens:100}));assert.equal(l.total(),100);assert.equal(l.reserve(1),null);}finally{l.close();}});
