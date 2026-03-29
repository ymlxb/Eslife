import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-zinc-100">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">关于我们</h1>
          <p className="mt-3 text-sm leading-7 text-zinc-700">
            我们致力于推广可持续生活方式，帮助用户在日常中做出更环保的选择。平台聚合了绿色消费、二手交易、社区交流和碳足迹管理等能力，
            让每一次选择都能为环境改善贡献力量。
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">我们的使命</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-700">
            通过产品化工具与社区协作，降低环保行动门槛，让更多人“知道怎么做、愿意去做、持续在做”。
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">联系我们</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>邮箱：jdq8576@126.com</li>
            <li>电话：+86 155 1672 2432</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
