import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const list = await prisma.address.findMany({
    where: { userId: me.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ code: 0, data: list });
}

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const addressee = typeof body?.addressee === "string" ? body.addressee.trim() : "";
  const mobile = typeof body?.mobile === "string" ? body.mobile.trim() : "";
  const province = typeof body?.province === "string" ? body.province.trim() : "";
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const fullAddress = typeof body?.fullAddress === "string" ? body.fullAddress.trim() : "";

  if (!addressee || !mobile || !province || !city || !fullAddress) {
    return NextResponse.json({ code: 1, msg: "参数不完整" }, { status: 400 });
  }

  const item = await prisma.address.create({
    data: {
      userId: me.id,
      addressee,
      mobile,
      province,
      city,
      fullAddress,
    },
  });

  return NextResponse.json({ code: 0, msg: "添加成功", data: item });
}
