import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const password = typeof body?.password === "string" ? body.password : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!password || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ code: 1, msg: "参数不合法" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) {
    return NextResponse.json({ code: 1, msg: "用户不存在" }, { status: 404 });
  }

  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) {
    return NextResponse.json({ code: 1, msg: "原密码错误" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: me.id }, data: { passwordHash } });

  return NextResponse.json({ code: 0, msg: "修改成功" });
}
