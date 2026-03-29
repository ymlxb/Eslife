import { redirect } from "next/navigation";
import Link from "next/link";

import AppNav from "@/components/AppNav";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function UserInfoPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-100">
      <AppNav username={user.displayName || user.username} />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">个人信息</h1>
          <div className="mt-6 space-y-3 text-sm">
            <p>
              <span className="text-zinc-500">用户名：</span>
              <span>{user.username}</span>
            </p>
            <p>
              <span className="text-zinc-500">显示名：</span>
              <span>{user.displayName || "未设置"}</span>
            </p>
            <p>
              <span className="text-zinc-500">昵称：</span>
              <span>{user.nickname || "未设置"}</span>
            </p>
            <p>
              <span className="text-zinc-500">性别：</span>
              <span>{user.gender === 0 ? "男" : user.gender === 1 ? "女" : "未设置"}</span>
            </p>
            <p>
              <span className="text-zinc-500">电话：</span>
              <span>{user.mobile || "未设置"}</span>
            </p>
            <p>
              <span className="text-zinc-500">邮箱：</span>
              <span>{user.email || "未设置"}</span>
            </p>
            <p>
              <span className="text-zinc-500">地址：</span>
              <span>{user.address || "未设置"}</span>
            </p>
            <p>
              <span className="text-zinc-500">头像：</span>
              <span>{user.avatar || "未设置"}</span>
            </p>
            <div className="pt-2">
              <div className="flex flex-wrap gap-2">
                <Link href="/person/editUserInfo" className="rounded-lg bg-black px-4 py-2 text-white">
                  编辑资料
                </Link>
                <Link href="/person/upAvatar" className="rounded-lg border border-zinc-300 px-4 py-2">
                  修改头像
                </Link>
                <Link href="/person/upPassWord" className="rounded-lg border border-zinc-300 px-4 py-2">
                  修改密码
                </Link>
                <Link href="/person/upAddress" className="rounded-lg border border-zinc-300 px-4 py-2">
                  收货地址
                </Link>
                <Link href="/person/userOrder" className="rounded-lg border border-zinc-300 px-4 py-2">
                  我的订单
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
