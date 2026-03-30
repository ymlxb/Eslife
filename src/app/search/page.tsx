import { Suspense } from "react";

import SearchClient from "@/app/search/SearchClient";
import PlantLoading from "@/components/PlantLoading";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ name?: string; tag?: string; day?: string; order?: string }>;
};

type CommodityItem = {
  id: number;
  name: string;
  detail: string | null;
  price: string;
  imageUrl: string | null;
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

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const name = sp.name?.trim() || "";
  const tag = sp.tag?.trim() || "";
  const day = Number(sp.day);
  const order = sp.order === "asc" || sp.order === "desc" ? sp.order : "";

  const queryParams = new URLSearchParams();
  if (name) queryParams.set("name", name);
  if (tag) queryParams.set("tag", tag);
  if (sp.day) queryParams.set("day", sp.day);
  if (order) queryParams.set("order", order);
  const initialQuery = queryParams.toString();

  const dayFilter = Number.isInteger(day) && day > 0
    ? { gte: new Date(Date.now() - day * 24 * 60 * 60 * 1000) }
    : undefined;

  let initialList: CommodityItem[] = [];
  if (name || tag) {
    const rawList = await prisma.commodity.findMany({
      where: {
        AND: [
          name ? { name: { contains: name } } : {},
          tag ? { tag } : {},
          dayFilter ? { createdAt: dayFilter } : {},
        ],
      },
      orderBy: order ? { price: order } : { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        detail: true,
        price: true,
        imageUrl: true,
      },
      take: 60,
    });

    initialList = rawList.map((item: (typeof rawList)[number]) => ({
      id: item.id,
      name: item.name,
      detail: item.detail,
      price: item.price.toString(),
      imageUrl: parseImageUrls(item.imageUrl)[0] || null,
    }));
  }

  return (
    <Suspense fallback={<main className="min-h-screen bg-zinc-100 px-6 py-8"><PlantLoading fullScreen text="正在检索绿色好物..." /></main>}>
      <SearchClient
        initialName={name}
        initialTag={tag}
        initialDay={sp.day || ""}
        initialOrder={order}
        initialList={initialList}
        initialQuery={initialQuery}
      />
    </Suspense>
  );
}
