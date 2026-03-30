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
    <main className="min-h-screen bg-[#f4efe6]">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-3xl border border-[#e1d5c6] bg-[#fcfaf6] p-5 shadow-[0_16px_42px_-30px_rgba(76,63,49,0.55)]">
          <p className="text-xs tracking-wide text-[#7f8e74]">ECO MATE · CARBON FOOTPRINT</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#5f4a3f]">碳足迹计算器</h1>
          <p className="mt-2 text-sm text-[#6f6257]">输入出行、用电与饮食信息，实时查看每日碳排构成与低碳优化建议。</p>
        </div>
        <div className="mt-6">
          <CarbonClient />
        </div>
      </div>
    </main>
  );
}
