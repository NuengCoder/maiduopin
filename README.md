# maiduopin 卖多品

拼多多风格的微信小程序商城，覆盖「浏览 → 拼团 / 砍价 / 秒杀 → 下单 → 模拟支付 → 订单」完整买家链路。

当前版本是可独立运行的 **买家端 MVP**：原生微信小程序（TypeScript + Less），使用本地 mock API 与本地存储，不依赖后端即可在微信开发者工具中演示。后端（NestJS + PostgreSQL + Redis）与商家后台按 [`maiduopin_impl_plan.md`](./maiduopin_impl_plan.md) 分阶段接入。

## 功能

- 首页：轮播、分类、限时秒杀、拼团热卖、猜你喜欢
- 分类与搜索：分类侧栏、关键词搜索、销量 / 价格排序
- 商品详情：多图、SKU、评价、店铺、收藏、优惠入口
- 购物车：选择、数量、删除、全选、结算
- 下单：收货地址管理、运费与优惠计算、模拟支付
- 订单：状态筛选、详情、取消、确认收货、物流时间线
- 增长玩法：拼团（模拟好友参团）、砍价（模拟好友帮砍）、限时秒杀、领券中心、邀请有礼
- 个人中心：订单入口、收藏、优惠券、地址、客服

## 本地运行

1. 安装依赖并检查：

   ```bash
   npm install
   npm test
   ```

2. 用微信开发者工具导入项目根目录（不是 `miniprogram/`）。
   - AppID：`wx51215759c997715b`（也可换成自己的测试号）
   - 项目已开启 `typescript` 与 `less` 编译插件
   - 基础库：`2.32.3`（`project.config.json`）
   - 渲染方式：WebView（`app.json` 中 `"renderer": "webview"`）

3. 编译后从首页开始体验。首次启动会自动写入演示数据（用户、地址、优惠券、一笔历史订单）。

### 重置演示数据

开发者工具 →「存储」面板清空缓存，或在控制台执行：

```js
wx.clearStorageSync()
```

## 演示路径

- **拼团**：首页 → 商品详情 → 发起拼团 → 拼团详情 →「模拟好友参团」→「立即支付」→ 模拟支付成功 → 订单详情。
- **砍价**：商品详情 → 发起砍价 → 多次「模拟好友帮砍一刀」→ 砍到底价 → 立即购买。
- **秒杀**：首页「限时秒杀」→ 选商品 → 确认订单 → 模拟支付。
- **优惠券**：首页「领券中心」→ 领取 → 下单时自动匹配最优可用券。

## 目录

```text
miniprogram/
  app.ts / app.json / app.less     应用入口、路由与全局样式
  pages/                           首页、分类、购物车、我的、搜索、商品详情
  packageOrder/                    结算、地址、订单
  packageGrowth/                   拼团、砍价、秒杀、优惠券、邀请
  packageUser/                     收藏
  components/                      navigation-bar、goods-card、price-tag、countdown、empty-state
  custom-tab-bar/                  自定义底部导航
  services/                        api 门面、mockApi、storage
  mock/                            演示商品、分类、店铺、优惠券数据（covers.ts 为生成文件）
  types/                           领域模型
  utils/                           金额、日期、UI 辅助
scripts/                           封面生成、本地静态服务、后端状态、清理
tests/                             页面完整性校验与 mock API 冒烟测试
index.html                         项目落地页
NTCRANFILE.yaml                    ntc 任务定义
```

## 检查命令

```bash
npm run typecheck      # TypeScript 类型检查
npm run validate:pages # 路由/组件/事件处理器完整性检查
npm run covers:check   # 校验自动生成的封面是否为最新
npm run test:smoke     # 编译 mock API 并跑完整业务冒烟测试
npm test               # 以上全部
```

也可以用项目自带的 `ntc` 任务（`NTCRANFILE.yaml`）：

```bash
ntc ran verify    # 快速闸门：类型 + 页面校验
ntc ran checks    # 完整闸门：再加冒烟测试与封面校验
ntc ran ci        # 与 CI 一致：安装依赖 + 全量检查
ntc ran backend   # 后端现状与待实现接口清单
ntc ran landing   # 本地预览根目录的落地页 index.html
ntc ran covers    # 重新生成商品封面
ntc ran clean     # 清理编译残留
```

> 在 Git Bash 里运行 `ntc ran <target>` 需要 ConPTY，请改用 PowerShell 或 Windows Terminal。

## 落地页

根目录的 `index.html` 是项目落地页（功能、玩法、性能说明与命令速查），无需构建：

```bash
npm run landing   # http://localhost:5173
```

## 图片与占位封面

商品封面不是网络图片。`scripts/gen-covers.js` 会按品类调色板生成 16×16 渐变 PNG，以 base64 data URI 内联在
`miniprogram/mock/covers.ts` 中，再由商品 emoji 叠加成一张可读的封面。这样首屏没有图片请求、离线可用，
也不需要在小程序后台配置图片域名。

需要换成真实商品图时，把 `miniprogram/mock/data.ts` 顶部的 `PHOTO_BASE` 指向 CDN，商品图会自动改为
`${PHOTO_BASE}/{productId}.jpg`，缺失时仍回退到生成的封面。

## 当前限制

- 支付为本地模拟，不会产生真实交易；上线前必须接入微信支付并在生产环境禁用 mock 支付。
- 数据保存在 `wx` 本地存储，换设备或清缓存后重置。
- 商品图为生成封面，生产环境应替换为真实商品图（见上一节）。
- 拼团好友、砍价助力为演示用虚拟用户，真实版本需由服务端校验。
- 尚未包含后端、商家后台、真实登录、消息订阅、售后审核与内容安全。

## 下一步

按实施计划推进：

1. `server/`：NestJS + Prisma + PostgreSQL + Redis，落地认证、商品、购物车、订单、模拟支付与增长活动。
2. `admin/`：Vite + React + Ant Design 运营后台（商品、库存、订单发货、活动、优惠券）。
3. 小程序 `services/api.ts` 从 mock 适配器切换到 REST 客户端。
4. 接入微信登录、微信支付、订阅消息、内容安全与真实设备回归。

详细架构、接口契约、数据模型与验收清单见 [`maiduopin_impl_plan.md`](./maiduopin_impl_plan.md)。
