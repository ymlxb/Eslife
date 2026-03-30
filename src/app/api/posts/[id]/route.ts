import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const postId = Number(id);

  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ code: 1, msg: "无效ID" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      category: { select: { id: true, name: true } },
      user: { select: { id: true, username: true, displayName: true, nickname: true } },
    },
  });

  if (!post) {
    return NextResponse.json({ code: 1, msg: "帖子不存在" }, { status: 404 });
  }

  return NextResponse.json({ code: 0, data: post });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const postId = Number(id);

  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ code: 1, msg: "无效ID" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ code: 1, msg: "帖子不存在" }, { status: 404 });
  }

  if (post.userId !== user.id) {
    return NextResponse.json({ code: 1, msg: "无权限" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: postId } });
  return NextResponse.json({ code: 0, msg: "删除成功" });
}
