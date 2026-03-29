import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import UpPasswordClient from "@/app/person/upPassWord/UpPasswordClient";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function UpPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-zinc-100">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-4 text-2xl font-semibold">修改密码</h1>
        <UpPasswordClient />
      </div>
    </main>
  );
}
