# Next.js + App Router + TypeScript + MySQL + Prisma

本项目已完成从 React（Vite）到 Next.js App Router 的重构落地，现状如下：

- Next.js App Router 主项目（TypeScript）
- Prisma + MySQL 数据层（已接入）
- 原 React 功能以“兼容层”方式完整挂载在 Next 中运行（静态构建产物位于 public/legacy）
- 访问 /login、/home、/trade 等原路由时，由 Next 捕获并加载 legacy 应用
- 第一批原生页面已落地：/login、/home、/trade、/person/userInfo
- 第一批原生接口已落地：/api/auth/\*、/api/commodities
- 第二批原生页面已落地：/community、/detail/[id]、/person/editUserInfo
- 第二批原生接口已落地：/api/posts\*、/api/post-categories、/api/users/me、/api/commodities/[id]
- 第三批原生页面已落地：/person/goodsPublish、/search、/im
- 第三批原生接口已落地：/api/chat/messages、/api/users/list
- 第四批原生页面已落地：/person/postPublish、/guide、/carbon
- 第四批能力补齐：/api/posts 支持我的帖子分页与标题筛选
- 第五批原生页面已落地：/about、/brand、/mall、/editMall、/ai、/person/upAddress、/person/upAvatar、/person/upPassWord、/person/userOrder
- 第五批原生接口已落地：/api/addresses\*、/api/users/avatar、/api/users/password、/api/commodities/[id] PATCH

## 环境要求

- Node.js 建议 20.19+（当前环境 20.12.2 也可运行，但部分工具会有版本警告）
- MySQL 8+

## 数据库配置

在 .env 中配置：

DATABASE_URL="mysql://user:password@localhost:3306/next_app"
DEEPSEEK_API_KEY="your_deepseek_api_key"
DEEPSEEK_MODEL="deepseek-chat"

执行：

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

建议首次迁移后再执行一次：

```bash
npm run prisma:migrate -- --name add_user_commodity_post_models
```

聊天能力迁移后再执行一次：

```bash
npm run prisma:migrate -- --name add_chat_message_model
```

地址能力迁移后再执行一次：

```bash
npm run prisma:migrate -- --name add_address_model
```

## 启动项目

```bash
npm run dev
```

打开后访问：

- /login（原生登录页）
- /home（原生首页）

## 说明

- Prisma 示例 API：/api/tasks、/api/tasks/[id]
- legacy 前端构建产物来自 react-app/dist，并已同步到 public/legacy
- 未迁移到原生页面的路径仍由 legacy 兼容层承接
