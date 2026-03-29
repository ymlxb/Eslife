import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import TradeClient from "./TradeClient";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; tag?: string }>;
};

type CommodityItem = {
  id: number;
  name: string;
  detail: string | null;
  tag: string | null;
  imageUrl: string | null;
  price: string;
  seller: { username: string; displayName: string | null };
};

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

export default async function TradePage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const sp = await searchParams;
  const q = sp.q?.trim();
  const tag = sp.tag?.trim();

  const rawList = await prisma.commodity.findMany({
    where: {
      AND: [
        q ? { name: { contains: q } } : {},
        tag ? { tag } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      seller: {
        select: { username: true, displayName: true },
      },
    },
  });

  const list: CommodityItem[] = rawList.map((item: (typeof rawList)[number]) => ({
    id: item.id,
    name: item.name,
    detail: item.detail,
    tag: item.tag,
    imageUrl: parseImageUrls(item.imageUrl)[0] || null,
    price: item.price.toString(),
    seller: item.seller,
  }));

  return (
    <main className="min-h-screen bg-zinc-100">
      <AppNav username={user.displayName || user.username} />
      <TradeClient initialList={list} initialTag={tag || ""} initialQuery={q || ""} />
    </main>
  );
}
