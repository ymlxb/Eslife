import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import CommunityClient from "@/components/CommunityClient";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Category = { id: number; name: string };
type PostItem = {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  createdAt: Date;
  category: Category;
  user: { id: number; username: string; displayName: string | null; nickname: string | null };
};

export default async function CommunityPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let categories = await prisma.postCategory.findMany({ orderBy: { id: "asc" } });
  if (categories.length === 0) {
    await prisma.postCategory.createMany({
      data: [{ name: "低碳生活" }, { name: "绿色出行" }, { name: "二手交易" }],
      skipDuplicates: true,
    });
    categories = await prisma.postCategory.findMany({ orderBy: { id: "asc" } });
  }

  const posts = (await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true } },
      user: { select: { id: true, username: true, displayName: true, nickname: true } },
    },
  })) as PostItem[];

  const payload = posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }));

  return (
    <main className="min-h-screen bg-zinc-100">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-semibold">绿色生活社区</h1>
        <p className="mt-2 text-zinc-600">原 React 的社区页已迁移为 Next.js 原生版本。</p>
        <div className="mt-6">
          <CommunityClient currentUserId={user.id} categories={categories as Category[]} posts={payload} />
        </div>
      </div>
    </main>
  );
}
