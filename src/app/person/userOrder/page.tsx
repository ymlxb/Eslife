import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function UserOrderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-zinc-100">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">我的订单</h1>
          <p className="mt-3 text-sm text-zinc-600">
            当前项目以二手商品与社区功能为主，订单模块已预留路由与页面入口，后续可按支付/履约流程继续扩展。
          </p>
        </section>
      </div>
    </main>
  );
}
