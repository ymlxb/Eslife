# EcoMate · 绿脉永续

一个面向绿色生活场景的全栈 Web 应用，集成了：

- 可持续社区与帖子互动
- 二手交易与商品发布
- 实时聊天室（WebSocket）
- AI 环保助手（DeepSeek + SSE 流式）
- 碳足迹可视化（ECharts）

项目已从旧 React 版本迁移到 Next.js App Router，当前为持续迭代版本。

## 技术栈

- Next.js 16（App Router）
- TypeScript
- Prisma + MySQL
- Axios（统一请求层）
- WebSocket（独立 `ws` 聊天服务）
- ECharts（碳足迹图表）
- wangEditor 5（社区发帖富文本）

## 核心功能

### 1) 用户与个人中心
- 登录鉴权
- 个人资料编辑
- 头像图片上传
- 密码修改

### 2) 社区论坛
- 话题发布 / 列表 / 搜索 / 筛选 / 分页
- 富文本内容展示
- 帖子详情与删除（权限校验）

### 3) 二手交易
- 商品发布（多图上传）
- 商品编辑 / 查询 / 详情

### 4) 实时聊天室
- 联系人列表
- 双向实时消息
- 消息落库与历史拉取

### 5) AI 环保助手
- DeepSeek 接口接入
- SSE 流式输出
- Markdown 风格文本渲染
- 友好错误提示（如余额不足）

### 6) 碳足迹模块
- 输入出行/用电/饮食参数
- 环形图展示碳排构成
- 中国地图展示省级数据
- 历史记录与低碳建议

## 项目结构（核心）

- [src/app](src/app)：页面与 API 路由
- [src/components](src/components)：复用组件
- [src/lib](src/lib)：鉴权、数据库、HTTP 封装
- [prisma](prisma)：数据模型与迁移
- [scripts/im-ws-server.mjs](scripts/im-ws-server.mjs)：聊天 WS 服务
- [public/legacy](public/legacy)：旧版兼容资源

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env`：

```env
DATABASE_URL="mysql://user:password@localhost:3306/next_app"
DEEPSEEK_API_KEY="your_deepseek_api_key"
DEEPSEEK_MODEL="deepseek-chat"
```

### 3. 初始化数据库

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

### 4. 启动服务

```bash
# Web 主服务
npm run dev

# 聊天 WS 服务（新终端）
npm run ws:dev
```

## 常用页面

- `/login`：登录
- `/home`：首页
- `/community`：社区
- `/trade`：二手交易
- `/im`：聊天室
- `/ai`：AI 助手
- `/carbon`：碳足迹


