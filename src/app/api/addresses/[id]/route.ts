import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Ctx) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const addressId = Number(id);
  if (!Number.isInteger(addressId)) {
    return NextResponse.json({ code: 1, msg: "无效ID" }, { status: 400 });
  }

  const row = await prisma.address.findUnique({ where: { id: addressId } });
  if (!row || row.userId !== me.id) {
    return NextResponse.json({ code: 1, msg: "无权限" }, { status: 403 });
  }

  await prisma.address.delete({ where: { id: addressId } });
  return NextResponse.json({ code: 0, msg: "删除成功" });
}
