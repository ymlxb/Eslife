import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const name = searchParams.get("name")?.trim();
  const tag = searchParams.get("tag")?.trim();
  const order = searchParams.get("order");
  const day = Number(searchParams.get("day"));

  const dayFilter = Number.isInteger(day) && day > 0
    ? { gte: new Date(Date.now() - day * 24 * 60 * 60 * 1000) }
    : undefined;

  const list = await prisma.commodity.findMany({
    where: {
      AND: [
        (q || name)
          ? {
              name: {
                contains: q || name,
              },
            }
          : {},
        tag
          ? {
              tag,
            }
          : {},
        dayFilter
          ? {
              createdAt: dayFilter,
            }
          : {},
      ],
    },
    orderBy: order === "asc" || order === "desc" ? { price: order } : { createdAt: "desc" },
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
  });

  const formatted = list.map((item: (typeof list)[number]) => {
    const imageUrls = parseImageUrls(item.imageUrl);
    return {
      ...item,
      imageUrl: imageUrls[0] || null,
      imageUrls,
    };
  });

  return NextResponse.json(
    { code: 0, data: formatted },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const detailRaw = typeof body?.detail === "string" ? body.detail.trim() : "";
  const descriptionRaw = typeof body?.description === "string" ? body.description.trim() : "";
  const detail = detailRaw || descriptionRaw || null;
  const tag = typeof body?.tag === "string" ? body.tag.trim() : null;
  const mobile = typeof body?.mobile === "string" ? body.mobile.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const priceNum = Number(body?.price);
  const stockNum = Number(body?.stock ?? 1);
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
  const imageUrls = Array.isArray(body?.imageUrls)
    ? body.imageUrls
        .filter((item: unknown) => typeof item === "string")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];
  const normalizedImageUrls = imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];

  if (!name || Number.isNaN(priceNum)) {
    return NextResponse.json({ code: 1, msg: "商品参数不合法" }, { status: 400 });
  }

  if (normalizedImageUrls.length === 0) {
    return NextResponse.json({ code: 1, msg: "请上传至少一张商品图片" }, { status: 400 });
  }

  if (mobile && !/^1[3-9]\d{9}$/.test(mobile)) {
    return NextResponse.json({ code: 1, msg: "联系电话格式不正确" }, { status: 400 });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ code: 1, msg: "邮箱格式不正确" }, { status: 400 });
  }

  if (mobile || email) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mobile: mobile || undefined,
        email: email || undefined,
      },
    });
  }

  const item = await prisma.commodity.create({
    data: {
      name,
      detail,
      tag,
      price: priceNum,
      stock: Number.isNaN(stockNum) ? 1 : stockNum,
      imageUrl: toStoredImageValue(normalizedImageUrls),
      sellerId: user.id,
    },
  });

  return NextResponse.json({
    code: 0,
    msg: "发布成功",
    data: {
      ...item,
      imageUrl: normalizedImageUrls[0] || null,
      imageUrls: normalizedImageUrls,
    },
  });
}
