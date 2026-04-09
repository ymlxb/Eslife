# EcoMate 架构说明（用于答辩/展示）

## 1. 项目定位

EcoMate 是一个“绿色生活 + 社区 + 交易 + AI + 实时通信 + 数据可视化”的全栈系统。

目标：将传统信息展示升级为“可交互、可沉淀、可决策”的环保产品。

---

## 2. 系统架构总览

### 前端层

- 框架：Next.js 16 App Router + React 19 + TypeScript
- UI：Tailwind CSS（大地色统一视觉）
- 可视化：ECharts（环形图 + 中国地图）
- 富文本：wangEditor5

### 服务层（Next API）

- 鉴权与会话：`/api/auth/*`
- 用户与资料：`/api/users/*`
- 社区帖子：`/api/posts*`、`/api/post-categories`
- 交易模块：`/api/commodities*`
- 上传服务：`/api/uploads/*`
- 地图数据代理：`/api/maps/china`
- AI 流式：`/api/ai/stream`（SSE）

### 实时通信层

- 独立 WebSocket 服务：`scripts/im-ws-server.mjs`
- 通信协议：`ws://localhost:8090/chat/chat/{username}`

### 数据层

- ORM：Prisma
- 数据库：MySQL
- 主要实体：User / Post / PostCategory / Commodity / Address / ChatMessage

---

## 3. 关键技术路线

### 3.1 迁移路线（React -> Next）

- 采用“增量迁移 + 兼容承接”策略：
  - 新功能与核心链路原生落地到 Next App Router
  - 遗留页面通过 `public/legacy` 过渡
- 优点：上线风险低、迭代不中断、可逐步替换旧代码

### 3.2 请求与错误治理

- 统一封装 `apiRequest`（Axios）替代散落 `fetch`
- 后端标准化返回 `{ code, msg, data }`
- 前端统一错误提示策略，降低排障成本

### 3.3 AI 流式输出

- 前端通过 `fetch` + `ReadableStream` 消费 SSE
- 后端对 DeepSeek 上游进行流式转发
- 对余额不足、鉴权失败等错误做语义化提示

### 3.4 实时聊天

- 放弃嵌入式网关，改独立 WS 服务，避免路由冲突
- 消息落库 + 在线推送 + 历史拉取
- 处理重复消息、断线重连、未读计数等体验问题

### 3.5 碳足迹可视化

- 环形图展示交通/用电/饮食占比
- 中国地图支持省级悬浮显示
- 最近记录持久化到 `localStorage`

### 3.6 前端 AI 工具调用（多轮二手筛选）

- 识别用户二手查询意图（关键词 + 追问）
- 解析价格、品类、数量等槽位
- 继承最近多轮上下文并做条件覆盖
- 前端先查真实商品数据，再将 `toolContext` 传给 AI
- 模型仅基于工具结果回答，避免编造

关键文件：

- `src/app/ai/AiClient.tsx`：意图识别、槽位抽取、前端工具调用、SSE 渲染
- `src/app/api/ai/stream/route.ts`：服务端二次兜底（工具调用/多轮规则）+ DeepSeek 流式转发

### 3.7 Coze Workflow 集成（碳足迹）

- 服务端调用 `workflow/stream_run`
- 解析 SSE `event: Message` 的 `content`
- 从文本中抽取 summary 与 `echarts` 代码块
- 前端标准化图表 option，确保图例与分项正确显示
- 点击饼图扇区触发 drilldown 深度分析

关键文件：

- `src/app/api/carbon/workflow/route.ts`
- `src/app/carbon/CarbonClient.tsx`

---

## 3.8 两条 AI 链路（面试高频）

### 链路 A：前端工具调用 + LLM 解释

1. 用户在 `/ai` 提问
2. 前端识别是否需要二手工具
3. 前端调用 `/api/commodities` 拉取真实数据
4. 生成 `toolContext` 随聊天请求发送
5. 服务端将 `toolContext` 注入系统消息
6. DeepSeek 流式输出最终回答

优势：更前端化、可控、低耦合、便于演示“工具调用能力”。

### 链路 B：服务端工具调用 + LLM 解释

1. 前端仅发自然语言
2. 服务端识别意图并执行查询
3. 将工具结果注入系统消息
4. DeepSeek 生成回答

优势：安全边界集中、可统一治理与审计。

---

## 3.9 碳足迹工作流时序

1. 前端提交交通/用电/饮食参数
2. `/api/carbon/workflow` 调 Coze `stream_run`
3. 服务端读取 SSE 全量文本并提取 `Message.content`
4. 抽取 summary 与 `echarts` 图表代码
5. 前端解析 option 并渲染饼图/交互
6. 用户点击分项触发 drilldown，再次请求工作流

---

## 3.10 安全与可靠性

- 所有第三方密钥仅保存在服务端环境变量
- 前端不直接调用第三方 AI/Workflow
- AI 结果经服务端解析后再下发，避免原始流污染前端
- 图表 option 渲染前做标准化，降低异常配置导致的显示问题

---

## 4. 难点与解决方案（可直接答辩使用）

### 难点 A：实时通信链路不稳定

- 问题：`/api/socket` 在复杂路由下被错误链路接管，连接失败
- 方案：拆分独立 WS 服务端口，前端直接连 WS
- 收益：连接稳定、职责清晰、便于扩展多实例

### 难点 B：AI 流式体验与异常可用性

- 问题：上游返回原始 JSON 错误，用户不可读
- 方案：后端解析上游错误并映射中文语义，前端统一展示
- 收益：可理解性提升，减少客服与排障成本

### 难点 C：地图数据源兼容

- 问题：浏览器直接拉第三方 GeoJSON 可能受网络/策略影响
- 方案：改为同源接口代理，再前端 `registerMap`
- 收益：地图可用性稳定，避免跨域与环境差异

### 难点 D：迁移期技术债与一致性

- 问题：新旧模块混用导致风格、请求、错误处理不统一
- 方案：建立统一视觉 tokens + HTTP 封装 + 页面模板化
- 收益：维护成本下降，开发效率提升

---

## 5. 亮点总结（简历可用）

1. 主导 React 项目向 Next.js App Router 的分阶段迁移，保障业务连续迭代。
2. 设计并落地 AI SSE 流式交互，支持增量渲染与错误语义化处理。
3. 从轮询升级到 WebSocket 实时通信，完成消息落库、重连、未读、自动滚动等完整体验。
4. 构建碳足迹可视化模块（ECharts），实现图表 + 地图 + 建议闭环。
5. 统一请求层与视觉风格，显著提升系统一致性与可维护性。

---

## 6. 性能与工程实践

- App Router + 服务端渲染提升首屏可达性
- API 分层与职责单一，便于测试与扩展
- `dynamic = "force-dynamic"` 用于需要实时数据的页面
- 图片上传做格式/大小校验，减少非法数据进入系统

---

## 7. 未来可扩展方向

- 接入 Redis 做 WS 会话与消息队列（多实例横向扩展）
- AI 引入对话记忆与用户画像策略
- 碳足迹模块接入真实省级排放因子数据源
- 引入埋点体系与 A/B 实验优化推荐效果

---

## 8. 本地运行（展示版）

1. 安装依赖：`npm install`
2. 配置 `.env`（数据库、DeepSeek Key）
3. 数据库迁移：`npm run prisma:generate` + `npm run prisma:migrate`
4. 启动 Web：`npm run dev`
5. 启动聊天服务：`npm run ws:dev`
