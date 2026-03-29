import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

function parseImageUrls(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const value = raw.trim();
  if (!value) return [];

  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch {
      return [value];
    }
  }

  return [value];
}

function toStoredImageValue(imageUrls: string[]): string | null {
  if (imageUrls.length === 0) return null;
  if (imageUrls.length === 1) return imageUrls[0];
  return JSON.stringify(imageUrls);
}

export async function GET(_: Request, { params }: Ctx) {
  const me = await getCurrentUser();
  const { id } = await params;
  const commodityId = Number(id);

  if (!Number.isInteger(commodityId)) {
    return NextResponse.json({ code: 1, msg: "无效ID" }, { status: 400 });
  }

  const item = await prisma.commodity.findUnique({
    where: { id: commodityId },
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          displayName: true,
          mobile: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ code: 1, msg: "商品不存在" }, { status: 404 });
  }

  const imageUrls = parseImageUrls(item.imageUrl);

  return NextResponse.json({
    code: 0,
    data: {
      ...item,
      imageUrl: imageUrls[0] || null,
      imageUrls,
      canDelete: me ? me.id === item.sellerId : false,
    },
  });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const commodityId = Number(id);

  if (!Number.isInteger(commodityId)) {
    return NextResponse.json({ code: 1, msg: "无效ID" }, { status: 400 });
  }

  const item = await prisma.commodity.findUnique({ where: { id: commodityId } });
  if (!item) {
    return NextResponse.json({ code: 1, msg: "商品不存在" }, { status: 404 });
  }

  if (item.sellerId !== user.id) {
    return NextResponse.json({ code: 1, msg: "无权限" }, { status: 403 });
  }

  await prisma.commodity.delete({ where: { id: commodityId } });
  return NextResponse.json({ code: 0, msg: "删除成功" });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const commodityId = Number(id);

  if (!Number.isInteger(commodityId)) {
    return NextResponse.json({ code: 1, msg: "无效ID" }, { status: 400 });
  }

  const item = await prisma.commodity.findUnique({ where: { id: commodityId } });
  if (!item) {
    return NextResponse.json({ code: 1, msg: "商品不存在" }, { status: 404 });
  }

  if (item.sellerId !== user.id) {
    return NextResponse.json({ code: 1, msg: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : item.name;
  const detail = typeof body?.detail === "string" ? body.detail.trim() : item.detail;
  const tag = typeof body?.tag === "string" ? body.tag.trim() : item.tag;
  const price = Number(body?.price);
  const stock = Number(body?.stock);
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
  const imageUrls = Array.isArray(body?.imageUrls)
    ? body.imageUrls
        .filter((value: unknown) => typeof value === "string")
        .map((value: string) => value.trim())
        .filter(Boolean)
    : parseImageUrls(item.imageUrl);
  const normalizedImageUrls = imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];

  const updated = await prisma.commodity.update({
    where: { id: commodityId },
    data: {
      name,
      detail,
      tag,
      price: Number.isNaN(price) ? item.price : price,
      stock: Number.isNaN(stock) ? item.stock : stock,
      imageUrl: toStoredImageValue(normalizedImageUrls),
    },
  });

  return NextResponse.json({
    code: 0,
    msg: "修改成功",
    data: {
      ...updated,
      imageUrl: normalizedImageUrls[0] || null,
      imageUrls: normalizedImageUrls,
    },
  });
}
