import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password || password.length < 6) {
    return NextResponse.json({ code: 1, msg: "参数不合法" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) {
    return NextResponse.json({ code: 1, msg: "用户名已存在" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, passwordHash, displayName: username },
  });

  return NextResponse.json({
    code: 0,
    msg: "注册成功",
    data: { id: user.id, username: user.username },
  });
}
