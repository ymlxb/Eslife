import { redirect } from "next/navigation";

import AiClient from "@/app/ai/AiClient";
import AppNav from "@/components/AppNav";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-zinc-100">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-semibold">AI 环保助手</h1>
        <p className="mt-2 text-zinc-600">已接入 DeepSeek 后端接口，采用 SSE 流式输出回复。</p>
        <div className="mt-6">
          <AiClient />
        </div>
      </div>
    </main>
  );
}
