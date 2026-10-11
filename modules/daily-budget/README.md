# 金融快讯：本地 DeepSeek 费用网关

本地试跑使用 DeepSeek 官方 `deepseek-flash` 非思考模式。引擎仍通过原有付费回执和调用次数预算发出请求；这个独立模块在请求发往官方接口前增加人民币费用限制。

默认限制是**任意滚动 24 小时最多 10 元**，比按自然日清零更保守。仅保护经此网关发出的本站请求，同一密钥在其他客户端的消费不在内。依据 [DeepSeek 官方人民币价格](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/)（2026-10-11 核对），按高峰、缓存未命中价格计算：输入 2 元/百万 tokens，输出 8 元/百万 tokens。忽略缓存、空闲时段优惠，所以账本数字是费用上界，实际账单通常更低；官方涨价时必须先停 worker 并更新费率。

每次调用先按输入 UTF-8 字节数、消息模板余量和最大输出额度预留费用；成功后按返回的 token 用量结算。SQLite 事务保证并发预留不能突破限额；重启保留账本。超时、错误或缺少用量的调用保留完整预留，避免未知消费被误当成零。若用量超过预留，持久停用后续请求，需检查后处理账本；不要通过删除账本重置预算。

只接受文字消息、非思考模式和最多 16384 个输出 tokens。网关仅监听 `127.0.0.1:3002`，只转发至固定的 DeepSeek 官方地址，不跟随重定向。密钥放在忽略提交的 `.env`，账本放在忽略提交的 `.data/deepseek-budget.sqlite`。

在仓库根目录的 `.env` 配置以下内容，密钥另行填写：

```dotenv
LLM_BASE_URL=http://127.0.0.1:3002/v1
LLM_MODEL=deepseek-flash
LLM_EXTRA_JSON='{"thinking":{"type":"disabled"}}'
```

用 Node.js 24 启动网关，再启动 API、网页和 worker：

```bash
node --env-file=.env modules/daily-budget/scripts/gateway.ts
node --env-file=.env apps/api/src/main.ts
# 新终端；网页已构建
cd apps/web
node --env-file=../../.env server.ts
# 新终端；回到仓库根目录
node --env-file=.env apps/worker/src/main.ts
```

只有明确授权真实试跑时才在本地 `.env` 开启 `MODEL_CALLS_ENABLED=true` 与 `COLLECT_ENABLED=true`。测试使用假服务，不启用外部调用。其他付费服务预算保持为零，推送和 IndexNow 保持关闭。数据库后台的次数预算与这个费用限额同时生效。网关离线时模型调用失败，不会自动绕过限额直连官方。

查看保守计费及仍在预留的调用（不会显示密钥或请求内容）：

```bash
node --input-type=module -e 'import {Ledger} from "./modules/daily-budget/ledger.ts"; const l=new Ledger(".data/deepseek-budget.sqlite"); console.log({guardedCny:l.total()/1e6,calls:l.db.prepare("SELECT state,count(*) AS count FROM calls GROUP BY state").all()}); l.close();'
```
