import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const data = {
    nickname: typeof body?.nickname === "string" ? body.nickname.trim() || null : undefined,
    gender: typeof body?.gender === "number" ? body.gender : undefined,
    mobile: typeof body?.mobile === "string" ? body.mobile.trim() || null : undefined,
    email: typeof body?.email === "string" ? body.email.trim() || null : undefined,
    address: typeof body?.address === "string" ? body.address.trim() || null : undefined,
    displayName:
      typeof body?.nickname === "string" && body.nickname.trim().length > 0
        ? body.nickname.trim()
        : undefined,
  };

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      id: true,
      username: true,
      displayName: true,
      nickname: true,
      gender: true,
      mobile: true,
      email: true,
      address: true,
      avatar: true,
    },
  });

  return NextResponse.json({ code: 0, msg: "修改成功", data: updated });
}
