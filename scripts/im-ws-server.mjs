import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PORT = Number(process.env.IM_WS_PORT || 8090);

const socketsByUsername = new Map();

function addSocket(username, ws) {
  if (!socketsByUsername.has(username)) {
    socketsByUsername.set(username, new Set());
  }
  socketsByUsername.get(username).add(ws);
}

function removeSocket(username, ws) {
  const set = socketsByUsername.get(username);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) {
    socketsByUsername.delete(username);
  }
}

function sendToUser(username, payload) {
  const set = socketsByUsername.get(username);
  if (!set) return;

  const text = JSON.stringify(payload);
  for (const client of set) {
    if (client.readyState === 1) {
      client.send(text);
    }
  }
}

async function resolveUserByUsername(username) {
  if (!username) return null;
  return prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true },
  });
}

async function handleChatMessage(ws, currentUsername, raw) {
  let body = null;
  try {
    body = JSON.parse(raw.toString());
  } catch {
    ws.send(JSON.stringify({ type: "error", msg: "消息格式错误" }));
    return;
  }

  const fromName =
    typeof body?.fromName === "string" ? body.fromName.trim() : "";
  const toName = typeof body?.toName === "string" ? body.toName.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!fromName || !toName || !content) {
    ws.send(JSON.stringify({ type: "error", msg: "参数不合法" }));
    return;
  }

  if (fromName !== currentUsername) {
    ws.send(JSON.stringify({ type: "error", msg: "身份不匹配" }));
    return;
  }

  if (content.length > 2000) {
    ws.send(JSON.stringify({ type: "error", msg: "消息长度不能超过2000" }));
    return;
  }

  const [fromUser, toUser] = await Promise.all([
    resolveUserByUsername(fromName),
    resolveUserByUsername(toName),
  ]);

  if (!fromUser || !toUser) {
    ws.send(JSON.stringify({ type: "error", msg: "用户不存在" }));
    return;
  }

  if (fromUser.id === toUser.id) {
    ws.send(JSON.stringify({ type: "error", msg: "不能给自己发消息" }));
    return;
  }

  const row = await prisma.chatMessage.create({
    data: {
      fromUserId: fromUser.id,
      toUserId: toUser.id,
      content,
    },
  });

  const payload = {
    id: row.id,
    fromName,
    toName,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };

  sendToUser(fromName, payload);
  if (toName !== fromName) {
    sendToUser(toName, payload);
  }
}

const server = createServer((_, res) => {
  res.statusCode = 200;
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.end("im-ws-server running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", async (ws, req) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length < 3 || parts[0] !== "chat" || parts[1] !== "chat") {
      ws.close(1008, "invalid path");
      return;
    }

    const username = decodeURIComponent(parts.slice(2).join("/")).trim();
    if (!username) {
      ws.close(1008, "invalid username");
      return;
    }

    const user = await resolveUserByUsername(username);
    if (!user) {
      ws.close(1008, "user not found");
      return;
    }

    addSocket(username, ws);

    ws.on("message", (raw) => {
      void handleChatMessage(ws, username, raw);
    });

    ws.on("close", () => {
      removeSocket(username, ws);
    });

    ws.on("error", () => {
      removeSocket(username, ws);
    });
  } catch {
    try {
      ws.close(1011, "server error");
    } catch {
      // noop
    }
  }
});

server.listen(PORT, () => {
  console.log(`[im-ws] running at ws://localhost:${PORT}/chat/chat/{username}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
