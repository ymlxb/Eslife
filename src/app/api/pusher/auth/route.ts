import { NextResponse } from "next/server";
import Pusher from "pusher";

import { getCurrentUser } from "@/lib/current-user";

const pusher =
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.PUSHER_CLUSTER
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER,
        useTLS: true,
      })
    : null;

function parseAuthBody(bodyText: string) {
  let socketId = "";
  let channelName = "";

  if (bodyText.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(bodyText) as { socket_id?: string; channel_name?: string };
      socketId = parsed.socket_id || "";
      channelName = parsed.channel_name || "";
      return { socketId, channelName };
    } catch {
      return { socketId, channelName };
    }
  }

  const params = new URLSearchParams(bodyText);
  socketId = params.get("socket_id") || "";
  channelName = params.get("channel_name") || "";
  return { socketId, channelName };
}

export async function POST(request: Request) {
  if (!pusher) {
    return NextResponse.json({ error: "Pusher 未配置" }, { status: 500 });
  }

  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const bodyText = await request.text();
  const { socketId, channelName } = parseAuthBody(bodyText);

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  const match = /^private-chat-(\d+)-(\d+)$/.exec(channelName);
  if (!match) {
    return NextResponse.json({ error: "频道不合法" }, { status: 400 });
  }

  const idA = Number(match[1]);
  const idB = Number(match[2]);
  if (me.id !== idA && me.id !== idB) {
    return NextResponse.json({ error: "无权订阅" }, { status: 403 });
  }

  const auth = pusher.authorizeChannel(socketId, channelName);
  return NextResponse.json(auth);
}
