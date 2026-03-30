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

  const displayName = user.displayName || user.nickname || user.username;
  const genderText = user.gender === 0 ? "男" : user.gender === 1 ? "女" : "未设置";
  const infoItems = [
    { label: "用户名", value: user.username || "未设置" },
    { label: "显示名", value: user.displayName || "未设置" },
    { label: "昵称", value: user.nickname || "未设置" },
    { label: "性别", value: genderText },
    { label: "电话", value: user.mobile || "未设置" },
    { label: "邮箱", value: user.email || "未设置" },
  ];

  return (
    <main className="min-h-screen bg-[#f4efe6]">
      <AppNav username={user.displayName || user.username} />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <section className="rounded-3xl border border-[#e1d5c6] bg-[#fcfaf6] p-6 shadow-[0_18px_50px_-35px_rgba(90,76,58,0.5)]">
          <div className="flex flex-col gap-4 border-b border-[#ebe1d4] pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs tracking-wide text-[#7f8e74]">PROFILE CENTER</p>
              <h1 className="mt-1 text-2xl font-semibold text-[#5f4a3f]">个人信息</h1>
              <p className="mt-1 text-sm text-[#7b6d60]">你好，{displayName}</p>
            </div>
            <div className="flex items-center gap-3">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt="用户头像"
                  className="h-20 w-20 rounded-2xl border border-[#d9c8b3] object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#d9c8b3] bg-[#f2e9dd] text-sm text-[#8a7868]">
                  无头像
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {infoItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-[#ece3d7] bg-white/80 px-4 py-3">
                <p className="text-xs text-[#978777]">{item.label}</p>
                <p className="mt-1 text-sm font-medium text-[#4f4137]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/person/editUserInfo" className="rounded-lg bg-[#5f7b57] px-4 py-2 text-sm text-white transition hover:bg-[#526b4b]">
              编辑资料
            </Link>
            <Link href="/person/upAvatar" className="rounded-lg border border-[#cfbea9] bg-white px-4 py-2 text-sm text-[#5f4a3f] transition hover:bg-[#f8f1e8]">
              修改头像
            </Link>
            <Link href="/person/upPassWord" className="rounded-lg border border-[#cfbea9] bg-white px-4 py-2 text-sm text-[#5f4a3f] transition hover:bg-[#f8f1e8]">
              修改密码
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
