import Link from "next/link";
import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type MyCommodity = {
  id: number;
  name: string;
  detail: string | null;
  price: { toString(): string };
  imageUrl: string | null;
};

export default async function GoodsPublishPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const list = (await prisma.commodity.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      detail: true,
      price: true,
      imageUrl: true,
    },
  })) as MyCommodity[];

  return (
    <main className="min-h-screen bg-zinc-100">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">我发布的商品</h1>
          <Link href="/trade" className="rounded-lg bg-black px-4 py-2 text-white">
            去发布新商品
          </Link>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-sm text-zinc-500">
            暂无发布商品
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((item) => (
              <article key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <Link href={`/detail/${item.id}`}>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="h-44 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                      暂无图片
                    </div>
                  )}
                  <h3 className="mt-3 text-base font-semibold">{item.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{item.detail || "暂无描述"}</p>
                  <p className="mt-2 text-emerald-700">¥{item.price.toString()}</p>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
