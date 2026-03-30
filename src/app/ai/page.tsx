import { redirect } from "next/navigation";

import AiClient from "@/app/ai/AiClient";
import AppNav from "@/components/AppNav";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="relative h-screen overflow-hidden bg-[#f1eadf]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(122,156,116,0.12),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(173,132,96,0.14),transparent_35%),radial-gradient(circle_at_50%_85%,rgba(125,161,123,0.08),transparent_32%)]" />
      <AppNav username={user.displayName || user.nickname || user.username} />
      <div className="relative mx-auto flex h-[calc(100vh-72px)] max-w-5xl flex-col overflow-hidden px-6 py-4">
        <div className="rounded-3xl border border-[#d7cab8] bg-[#f7f1e7]/85 p-4 shadow-[0_16px_38px_-26px_rgba(95,74,58,0.6)]">
          <p className="text-sm tracking-wide text-[#64795c]">Eco Companion</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#5f4a3f]">AI 环保助手</h1>
          <p className="mt-1 text-sm leading-6 text-[#6f6257]">
            用温和、可靠的方式陪你完成每一次绿色行动。
          </p>
        </div>
        <div className="mt-4 min-h-0 flex-1">
          <AiClient />
        </div>
      </div>
    </main>
  );
}
