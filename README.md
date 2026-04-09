# EcoMate · 绿脉永续

> 🚀 **部署教程（掘金）**：https://juejin.cn/post/7623266346480074752
>
> 首次部署建议先阅读上文，按文章步骤完成环境与上线配置。

EcoMate 是一个面向“绿色生活”场景的全栈系统，覆盖社区互动、二手循环交易、实时聊天、AI 助手与碳足迹分析。

当前版本基于 Next.js App Router，支持：

- 社区内容发布与检索
- 二手商品发布与筛选
- WebSocket 实时私聊
- AI 流式对话（SSE）
- 前端 AI 工具调用（多轮二手查询）
- Coze 工作流碳足迹分析与图表展示

---

## 1. 技术栈

### 前端

- Next.js 16（App Router）
- React 19 + TypeScript
- Tailwind CSS 4
- ECharts 6（饼图 + 地图）

### 后端 / 数据层

- Next.js Route Handlers（API 路由）
- Prisma 5 + MySQL
- `ws`（独立实时聊天服务）

### AI / 工作流

- DeepSeek Chat Completions（SSE）
- Coze Workflow `stream_run`

---

## 2. 核心能力

### 2.1 AI 助手（流式）

- 服务端代理 DeepSeek 接口并转发 SSE
- 客户端增量渲染回复
- 统一错误语义化（如余额不足、鉴权失败）

### 2.2 前端 AI 工具调用（重点）

在 AI 聊天页实现了“前端先调工具，再把结构化结果喂给模型”的能力：

1. 意图识别：是否属于二手查询或追问延续
2. 槽位抽取：价格区间、品类、数量
3. 多轮融合：继承最近若干轮筛选条件并覆盖更新
4. 前端调用 `/api/commodities` 获取真实数据
5. 将 `toolContext` 注入 `/api/ai/stream`，让模型仅基于工具结果回答

相关实现：

- [src/app/ai/AiClient.tsx](src/app/ai/AiClient.tsx)
- [src/app/api/ai/stream/route.ts](src/app/api/ai/stream/route.ts)

### 2.3 碳足迹工作流

- 前端收集交通/用电/饮食参数
- 服务端调用 Coze `stream_run`
- 解析 SSE 中 `Message` 内容
- 抽取 summary 与 ECharts option 代码
- 支持点击饼图分项触发深度分析（drilldown）

相关实现：

- [src/app/carbon/CarbonClient.tsx](src/app/carbon/CarbonClient.tsx)
- [src/app/api/carbon/workflow/route.ts](src/app/api/carbon/workflow/route.ts)

---

## 3. 功能模块

### 用户与账号

- 注册 / 登录 / 退出
- 个人资料编辑
- 地址管理

### 社区

- 分类、发帖、列表、详情
- 富文本内容展示

### 二手交易

- 商品发布、查询、详情
- 基于关键词/价格/数量筛选

### 实时聊天

- 独立 WS 服务
- 消息落库与实时推送

### AI 与碳足迹

- `/ai`：流式问答 + 工具调用
- `/carbon`：工作流分析 + 图表可视化

---

## 4. 目录结构（核心）

- [src/app](src/app)：页面与 API 路由
- [src/components](src/components)：复用组件
- [src/lib](src/lib)：鉴权、Prisma、请求封装
- [prisma/schema.prisma](prisma/schema.prisma)：数据模型
- [scripts/im-ws-server.mjs](scripts/im-ws-server.mjs)：聊天 WS 服务
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)：架构说明（答辩版）
- [public/legacy](public/legacy)：历史静态资源

---

## 5. 数据模型（Prisma）

核心实体：

- `User`：用户
- `Commodity`：二手商品
- `Post` / `PostCategory`：社区帖子与分类
- `ChatMessage`：私聊消息
- `Address`：收货地址
- `Task`：示例任务

完整定义见 [prisma/schema.prisma](prisma/schema.prisma)。

---

## 6. API 概览

按功能分组（部分）：

- 鉴权：`/api/auth/*`
- 用户：`/api/users/*`
- 地址：`/api/addresses/*`
- 社区：`/api/posts*`、`/api/post-categories`
- 商品：`/api/commodities*`
- 上传：`/api/uploads/*`
- AI 流式：`/api/ai/stream`
- 碳足迹工作流：`/api/carbon/workflow`
- 地图：`/api/maps/china`
- 聊天：`/api/chat/messages`、`/api/pusher/auth`（可选）

---

## 7. 环境变量

在项目根目录创建 `.env`。

### 必填（本地最小可运行）

```env
DATABASE_URL="mysql://user:password@localhost:3306/next_app"
AUTH_SECRET="replace-with-strong-secret"
DEEPSEEK_API_KEY="your_deepseek_api_key"
DEEPSEEK_MODEL="deepseek-chat"
```

### 碳足迹工作流（启用 `/carbon` AI 分析时）

```env
COZE_API_TOKEN="your_coze_pat"
COZE_WORKFLOW_ID="your_workflow_id"
COZE_BASE_URL="https://api.coze.cn"
```

### 可选（第三方服务）

```env
# 上传（Vercel Blob）
BLOB_READ_WRITE_TOKEN=""

# Pusher（如果启用）
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER=""
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER=""

# 独立 WS 服务端口
IM_WS_PORT="8090"
```

### 可选（上游代理接口）

```env
UPSTREAM_SERVICE_TOKEN=""
SECONDHAND_UPSTREAM_URL=""
SECONDHAND_UPSTREAM_TOKEN=""
CARBON_UPSTREAM_URL=""
CARBON_UPSTREAM_TOKEN=""
LOWCARBON_UPSTREAM_URL=""
LOWCARBON_UPSTREAM_TOKEN=""
WORKFLOW_SERVICE_TOKEN=""
```

---

## 8. 本地开发

> 📦 **线上部署指南**：https://juejin.cn/post/7623266346480074752

### 8.1 安装依赖

```bash
npm install
```

### 8.2 初始化 Prisma

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

### 8.3 启动服务

```bash
# Next.js
npm run dev

# WebSocket 聊天服务（新终端）
npm run ws:dev
```

默认地址：

- Web: `http://localhost:3000`
- WS: `ws://localhost:8090/chat/chat/{username}`

---

## 9. 页面路由

- `/login`：登录
- `/home`：首页
- `/community`：社区
- `/trade`：二手交易
- `/im`：实时聊天
- `/ai`：AI 助手
- `/carbon`：碳足迹

---

## 10. 常用脚本

```bash
npm run dev            # 本地开发
npm run build          # 生产构建（含 prisma generate）
npm run start          # 生产启动
npm run lint           # ESLint
npm run ws:dev         # 聊天 WS 服务
npm run prisma:generate
npm run prisma:migrate
```

---

## 11. 故障排查

### 11.1 `未登录 / 401`

- 检查登录状态与 Cookie 是否存在
- 确认 `AUTH_SECRET` 已配置

### 11.2 数据库连接失败（P1000/P1001）

- 检查 `DATABASE_URL` 用户名、密码、端口
- 确认 MySQL 服务已启动并可访问

### 11.3 AI 无响应

- 检查 `DEEPSEEK_API_KEY`
- 查看 `/api/ai/stream` 返回错误信息

### 11.4 碳足迹工作流失败

- 检查 `COZE_API_TOKEN`、`COZE_WORKFLOW_ID`
- 查看 `/api/carbon/workflow` 的错误返回

### 11.5 上传失败

- 检查 `BLOB_READ_WRITE_TOKEN`

---

## 12. 架构文档

更完整的系统设计、难点与答辩话术见：

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---
