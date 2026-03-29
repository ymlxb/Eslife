import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import CarbonClient from "@/app/carbon/CarbonClient";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function CarbonPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-100">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">碳足迹计算器</h1>
        <p className="mt-2 text-zinc-600">原 CarbonFootprint 页面已迁移为 Next.js 原生版。</p>
        <div className="mt-6">
          <CarbonClient />
        </div>
      </div>
    </main>
  );
}
