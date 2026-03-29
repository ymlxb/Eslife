import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import EditUserInfoForm from "@/components/EditUserInfoForm";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function EditUserInfoPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-100">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-4 text-2xl font-semibold">编辑个人信息</h1>
        <EditUserInfoForm
          username={user.username}
          nickname={user.nickname}
          gender={user.gender}
          mobile={user.mobile}
          email={user.email}
          address={user.address}
        />
      </div>
    </main>
  );
}
