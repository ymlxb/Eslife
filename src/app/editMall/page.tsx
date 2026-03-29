import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import EditMallClient from "./EditMallClient";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function EditMallPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;

  return (
    <main className="min-h-screen bg-zinc-100">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-4 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-4 text-white shadow-sm">
          <h1 className="text-2xl font-semibold">修改商品信息</h1>
          <p className="mt-1 text-sm text-cyan-50">优化标题、价格和描述，提升商品曝光和成交率。</p>
        </div>
        <EditMallClient commodityId={sp.id} />
      </div>
    </main>
  );
}
