import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, signSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ code: 1, msg: "用户名或密码不能为空" }, { status: 400 });
  }

  let user: Awaited<ReturnType<typeof prisma.user.findUnique>>;

  try {
    user = await prisma.user.findUnique({ where: { username } });
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P1000") {
      return NextResponse.json({ code: 1, msg: "数据库账号或密码错误，请检查 DATABASE_URL 配置" }, { status: 503 });
    }

    return NextResponse.json({ code: 1, msg: "服务暂不可用，请稍后重试" }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ code: 1, msg: "用户名或密码错误" }, { status: 401 });
  }

  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) {
    return NextResponse.json({ code: 1, msg: "用户名或密码错误" }, { status: 401 });
  }

  const token = await signSession({ uid: user.id, username: user.username });

  (await cookies()).set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({
    code: 0,
    msg: "登录成功",
    data: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    },
  });
}
