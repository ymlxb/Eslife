"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import LogoutButton from "@/components/LogoutButton";

type Props = {
  username?: string;
  avatar?: string | null;
};

const navItems = [
  { href: "/home", label: "首页" },
  { href: "/guide", label: "绿色生活指南" },
  { href: "/brand", label: "可持续品牌" },
  { href: "/trade", label: "二手交易" },
  { href: "/community", label: "社区论坛" },
  { href: "/about", label: "关于我们" },
  { href: "/im", label: "聊天室" },
  { href: "/ai", label: "AI助手" },
  { href: "/carbon", label: "碳足迹" },
];

export default function AppNav({ username, avatar }: Props) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/home" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
              绿
            </span>
            <span className="text-base font-semibold text-zinc-900">绿脉永续</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-sm transition ${active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <details className="relative">
            <summary className="list-none cursor-pointer rounded-full border border-zinc-200 px-2 py-1 hover:bg-zinc-50">
              <div className="flex items-center gap-2">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm text-white">
                    {(username || "U").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="max-w-24 truncate text-sm text-zinc-700">{username || "未登录"}</span>
              </div>
            </summary>

            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
              <Link href="/person/userInfo" className="block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
                个人中心
              </Link>
              <Link href="/person/goodsPublish" className="block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
                我的商品
              </Link>
              <Link href="/person/postPublish" className="block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
                我的帖子
              </Link>
              <div className="pt-1">
                <LogoutButton className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50" />
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
