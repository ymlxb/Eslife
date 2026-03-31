import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import HomeClient from "@/app/home/HomeClient";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type CommodityCard = {
  id: number;
  name: string;
  price: { toString(): string } | string;
  detail: string | null;
  seller: {
    username: string;
    displayName: string | null;
  };
};

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const latest = await prisma.commodity.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      seller: {
        select: { username: true, displayName: true },
      },
    },
  });

  const latestList = latest as CommodityCard[];

  const viewList = latestList.map((item) => ({
    id: item.id,
    name: item.name,
    price: typeof item.price === "string" ? item.price : item.price.toString(),
    detail: item.detail,
    sellerName: item.seller.displayName || item.seller.username,
  }));

  return (
    <main className="min-h-screen bg-zinc-100">
      <AppNav username={user.displayName || user.nickname || user.username} avatar={user.avatar} />
      <HomeClient latestList={viewList} />
    </main>
  );
}
