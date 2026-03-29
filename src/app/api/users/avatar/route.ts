import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const avatar = typeof body?.avatar === "string" ? body.avatar.trim() : "";

  if (!avatar) {
    return NextResponse.json({ code: 1, msg: "头像地址不能为空" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: me.id },
    data: { avatar },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
    },
  });

  return NextResponse.json({ code: 0, msg: "修改成功", data: user });
}
