// Regression for the real Jin10 feed shape: main publication dates, separate VIP
// lists and offsite WeChat redirects must survive the site's source configuration.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { stub } from "./setup.ts";
import { config } from "@aihot/backend/config";
import { fetchJsonList } from "@aihot/backend/sources/json-list";
import { admitListing } from "@aihot/backend/sources/filters";
import type { SourceRow } from "@aihot/backend/sources/types";

const source = JSON.parse(readFileSync(new URL("../industry/sources.json", import.meta.url), "utf8")).sources.find((s: SourceRow) => s.id === "jin10-news") as SourceRow;

test("Jin10 keeps the primary Beijing date and refuses VIP and offsite entries", async () => {
  const row = { id: 232129, title: "霍尔木兹传出油轮触雷：22名船员获救，紧张运力再添新变量", display_datetime: "2026-10-11 14:10:48", introduction: "两份通报尚无法对应。", vip: 0, web_redirect_url: null };
  const server = await stub(() => ({ list: [row, { ...row, id: 2, vip: 1 }, { ...row, id: 3, web_redirect_url: "https://mp.weixin.qq.com/s?article=3" }, { ...row, id: 4, vip: undefined }], vip_list: [{ ...row, id: 5, vip: 1 }], recommend: [{ ...row, id: 6, display_datetime: "2026-01-01 00:00:00" }] }));
  const previous = config.allowPrivateNetworkFetch;
  config.allowPrivateNetworkFetch = true;
  try {
    const local = { ...source, config: { ...source.config, url: server.url } };
    const items = admitListing(await fetchJsonList(local), local);
    assert.equal(items.length, 1);
    assert.equal(items[0]!.url, "https://xnews.jin10.com/details/232129");
    assert.equal(items[0]!.publishedAt!.toISOString(), "2026-10-11T06:10:48.000Z");
    assert.equal(items[0]!.excerpt, row.introduction);
  } finally {
    config.allowPrivateNetworkFetch = previous;
    await server.close();
  }
});
