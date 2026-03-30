import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import UpPasswordClient from "@/app/person/upPassWord/UpPasswordClient";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function UpPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-[#f4efe6]">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-4 rounded-2xl border border-[#e1d5c6] bg-[#fcfaf6] px-5 py-4 shadow-[0_12px_32px_-24px_rgba(90,76,58,0.45)]">
          <p className="text-xs tracking-wide text-[#7f8e74]">SECURITY CENTER</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#5f4a3f]">修改密码</h1>
        </div>
        <UpPasswordClient />
      </div>
    </main>
  );
}
