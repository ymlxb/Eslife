import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const categoryId = Number(searchParams.get("categoryId"));
  const postId = Number(searchParams.get("postId"));
  const currentPage = Number(searchParams.get("currentPage"));
  const pageSize = Number(searchParams.get("pageSize"));
  const title = searchParams.get("title")?.trim();
  const mine = searchParams.get("mine") === "1";

  const where = {
    ...(Number.isInteger(categoryId) ? { categoryId } : {}),
    ...(Number.isInteger(postId) ? { id: postId } : {}),
    ...(title ? { title: { contains: title } } : {}),
    ...(mine && user ? { userId: user.id } : {}),
  };

  const hasPagination = Number.isInteger(currentPage) && Number.isInteger(pageSize) && currentPage > 0 && pageSize > 0;

  if (hasPagination) {
    const [total, list] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        include: {
          category: true,
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({ code: 0, data: { list, total } });
  }

  const list = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          nickname: true,
          avatar: true,
        },
      },
    },
  });

  return NextResponse.json({ code: 0, data: list });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const categoryId = Number(body?.categoryId);

  if (!title || !content || !Number.isInteger(categoryId)) {
    return NextResponse.json({ code: 1, msg: "参数不合法" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      title,
      content,
      excerpt: content.slice(0, 120),
      categoryId,
      userId: user.id,
    },
  });

  return NextResponse.json({ code: 0, msg: "发布成功", data: post });
}
