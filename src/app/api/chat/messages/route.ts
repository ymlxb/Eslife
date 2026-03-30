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

  if (!Number.isInteger(toUserId) || toUserId <= 0) {
    return NextResponse.json({ code: 1, msg: "缺少聊天对象" }, { status: 400 });
  }

  if (toUserId === me.id) {
    return NextResponse.json({ code: 1, msg: "不能和自己聊天" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: toUserId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ code: 1, msg: "聊天对象不存在" }, { status: 404 });
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

  if (!Number.isInteger(toUserId) || toUserId <= 0 || !content) {
    return NextResponse.json({ code: 1, msg: "参数不合法" }, { status: 400 });
  }

  if (toUserId === me.id) {
    return NextResponse.json({ code: 1, msg: "不能给自己发消息" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ code: 1, msg: "消息长度不能超过2000" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: toUserId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ code: 1, msg: "聊天对象不存在" }, { status: 404 });
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
