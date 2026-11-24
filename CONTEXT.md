# Project context

## Goal

卖多品（maiduopin）是一个拼多多风格的微信小程序商城，让用户通过拼团、砍价、秒杀和优惠券以更低价格购买商品。

## Scope

- In scope（v1）：买家端浏览、搜索、商品详情、购物车、地址、下单、模拟支付、订单、拼团、砍价、秒杀、优惠券、邀请、收藏、客服入口。
- Out of scope（v1）：真实微信支付、完整 IM、复杂售后审核、跨店结算、直播、内容社区。

## Decisions

- 客户端：原生微信小程序，TypeScript + Less，自定义导航栏与自定义 tab bar，WebView 渲染。
- 后端：外部 REST API，计划使用 Node 22 + NestJS + PostgreSQL + Redis + Prisma。
- 支付：v1 仅本地模拟支付，后续通过支付提供方抽象接入微信支付。
- 商家/运营：独立 Web 后台（React + Vite + Ant Design），不做小程序内商家中心。
- 当前实现：买家端 MVP 使用 `services/mockApi.ts` + `wx` 本地存储，`services/api.ts` 作为可替换门面。
- 金额：领域模型统一使用整数分（fen），展示层经 `utils/money.ts` 转换。
- 商品图：不使用网络占位图。`scripts/gen-covers.js` 生成 16×16 渐变 PNG（base64 data URI，按品类配色），
  叠加商品 emoji 作为封面；首屏零图片请求、离线可用、无需配置图片域名。真实图片通过 `PHOTO_BASE` 切换。
- 列表数据：列表接口返回 `ProductCard`（不含 `images`/`skus`/`reviews`/`description`），只有详情页加载完整商品，
  避免大对象进 `setData`。
- 任务入口：`NTCRANFILE.yaml` 统一 `verify` / `checks` / `test` / `ci` / `backend` / `landing` 等任务。
