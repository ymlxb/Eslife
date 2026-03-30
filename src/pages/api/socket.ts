import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import type { Socket } from "net";
import { Server as IOServer } from "socket.io";

import { verifySession, AUTH_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type NextApiResponseWithSocket = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: IOServer;
    };
  };
};

function getCookieValue(cookieHeader: string | undefined, key: string) {
  if (!cookieHeader) return "";
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [k, ...rest] = pair.trim().split("=");
    if (k === key) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export default function handler(_: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: "/api/socket",
      cors: {
        origin: true,
        credentials: true,
      },
      transports: ["websocket"],
    });

    io.use(async (socket, next) => {
      try {
        const token = getCookieValue(socket.handshake.headers.cookie, AUTH_COOKIE_NAME);
        if (!token) {
          next(new Error("未登录"));
          return;
        }

        const payload = await verifySession(token);
        const uid = Number(payload.uid);

        if (!Number.isInteger(uid) || uid <= 0) {
          next(new Error("鉴权失败"));
          return;
        }

        socket.data.uid = uid;
        next();
      } catch {
        next(new Error("鉴权失败"));
      }
    });

    io.on("connection", (socket) => {
      const uid = Number(socket.data.uid);
      const room = `user:${uid}`;
      socket.join(room);

      socket.on(
        "chat:send",
        async (
          payload: { toUserId?: number; content?: string },
          ack?: (data: { code: number; msg?: string }) => void
        ) => {
          try {
            const toUserId = Number(payload?.toUserId);
            const content = typeof payload?.content === "string" ? payload.content.trim() : "";

            if (!Number.isInteger(toUserId) || toUserId <= 0 || !content) {
              ack?.({ code: 1, msg: "参数不合法" });
              return;
            }
            if (toUserId === uid) {
              ack?.({ code: 1, msg: "不能给自己发消息" });
              return;
            }
            if (content.length > 2000) {
              ack?.({ code: 1, msg: "消息长度不能超过2000" });
              return;
            }

            const target = await prisma.user.findUnique({ where: { id: toUserId }, select: { id: true } });
            if (!target) {
              ack?.({ code: 1, msg: "聊天对象不存在" });
              return;
            }

            const msg = await prisma.chatMessage.create({
              data: {
                fromUserId: uid,
                toUserId,
                content,
              },
            });

            io.to(`user:${uid}`).to(`user:${toUserId}`).emit("chat:new", msg);
            ack?.({ code: 0 });
          } catch {
            ack?.({ code: 1, msg: "发送失败" });
          }
        }
      );
    });

    res.socket.server.io = io;
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
