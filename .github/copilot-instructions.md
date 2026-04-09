# Copilot 项目协作说明（EcoMate）

## 项目现状

- 框架：Next.js App Router + TypeScript
- 数据库：Prisma + MySQL
- AI：DeepSeek SSE（聊天）、Coze Workflow（碳足迹）
- 实时：独立 WebSocket 服务（`scripts/im-ws-server.mjs`）

## 开发原则

1. 默认在当前工作区根目录开发，不新建额外项目目录。
2. 优先最小改动，不重构无关代码。
3. 新增功能应优先放在 `src/app`（页面/路由）与 `src/lib`（通用逻辑）。
4. 涉及 AI 或第三方服务时，密钥仅使用服务端环境变量，不下发到客户端。
5. 修改后应至少完成类型/语法检查，确保不引入明显错误。

## 文档要求

1. `README.md` 必须保持可运行、可交接：
   - 功能说明
   - 环境变量
   - 本地启动步骤
   - 常见问题
2. 架构层面的变更同步更新 `docs/ARCHITECTURE.md`。
3. 若接口行为变化，README 的 API 概览与示例需同步。

## 关键模块位置

- AI 聊天前端：`src/app/ai/AiClient.tsx`
- AI 流式路由：`src/app/api/ai/stream/route.ts`
- 碳足迹页面：`src/app/carbon/CarbonClient.tsx`
- Coze 工作流路由：`src/app/api/carbon/workflow/route.ts`
- Prisma 模型：`prisma/schema.prisma`

## 交付标准

- 功能正确
- 无新增编译/类型错误
- 文档同步更新
- 说明简洁、可复现
