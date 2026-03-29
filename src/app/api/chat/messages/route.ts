import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const toUserId = Number(searchParams.get("toUserId"));

  if (!Number.isInteger(toUserId)) {
    return NextResponse.json({ code: 1, msg: "缺少聊天对象" }, { status: 400 });
  }

  const list = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { fromUserId: me.id, toUserId },
        { fromUserId: toUserId, toUserId: me.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ code: 0, data: list });
}

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const toUserId = Number(body?.toUserId);
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!Number.isInteger(toUserId) || !content) {
    return NextResponse.json({ code: 1, msg: "参数不合法" }, { status: 400 });
  }

  const msg = await prisma.chatMessage.create({
    data: {
      fromUserId: me.id,
      toUserId,
      content,
    },
  });

  return NextResponse.json({ code: 0, data: msg });
}
