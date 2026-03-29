import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { id: { not: me.id } },
    select: {
      id: true,
      username: true,
      displayName: true,
      nickname: true,
      avatar: true,
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ code: 0, data: users });
}
