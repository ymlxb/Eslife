"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/http";

type CommodityItem = {
  id: number;
  name: string;
  detail: string | null;
  price: string | number;
  imageUrl: string | null;
};

const topList = ["数码", "图书音像", "宠物花卉", "美容彩妆", "运动健身"];

type Props = {
  initialName?: string;
  initialTag?: string;
  initialDay?: string;
  initialOrder?: string;
};

export default function SearchClient({
  initialName = "",
  initialTag = "",
  initialDay = "",
  initialOrder = "",
}: Props) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [tag, setTag] = useState(initialTag);
  const [day, setDay] = useState(initialDay);
  const [order, setOrder] = useState(initialOrder);
  const [list, setList] = useState<CommodityItem[]>([]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (name.trim()) p.set("name", name.trim());
    if (tag.trim()) p.set("tag", tag.trim());
    if (day) p.set("day", day);
    if (order) p.set("order", order);
    return p.toString();
  }, [name, tag, day, order]);

  const searchUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (name.trim()) p.set("name", name.trim());
    if (tag.trim()) p.set("tag", tag.trim());
    if (day) p.set("day", day);
    if (order) p.set("order", order);
    const q = p.toString();
    return q ? `/search?${q}` : "/search";
  }, [name, tag, day, order]);

  useEffect(() => {
    const run = async () => {
      if (!name.trim() && !tag.trim()) {
        setList([]);
        return;
      }
      const res = await apiRequest<{ code: number; data?: CommodityItem[] }>({
        url: `/api/commodities?${query}`,
        method: "GET",
      });
      if (res.ok && res.data.code === 0) {
        setList(res.data.data || []);
      }
    };
    run();
  }, [query, name, tag]);

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 p-[1px] shadow-md">
          <div className="rounded-2xl bg-white p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {topList.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setTag(item);
                  setName("");
                }}
                className={`rounded-full px-3 py-1 text-sm transition ${tag === item ? "bg-emerald-500 text-white" : "bg-zinc-100 hover:bg-emerald-100 hover:text-emerald-700"}`}
              >
                {item}
              </button>
            ))}
            {tag && (
              <button onClick={() => setTag("")} className="rounded-full bg-zinc-200 px-3 py-1 text-sm text-zinc-700 transition hover:bg-zinc-300">
                清除分类
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="输入商品名" className="h-10 flex-1 rounded-lg border border-zinc-300 px-3 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
            <select value={day} onChange={(e) => setDay(e.target.value)} className="h-10 rounded-lg border border-zinc-300 px-2 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
              <option value="">发布时间</option>
              <option value="1">1天内</option>
              <option value="3">3天内</option>
              <option value="7">7天内</option>
              <option value="14">14天内</option>
            </select>
            <select value={order} onChange={(e) => setOrder(e.target.value)} className="h-10 rounded-lg border border-zinc-300 px-2 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
              <option value="">价格排序</option>
              <option value="asc">从低到高</option>
              <option value="desc">从高到低</option>
            </select>
            <button onClick={() => router.replace(searchUrl)} className="h-10 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 font-medium text-white transition hover:from-emerald-600 hover:to-teal-600">搜索</button>
            <Link href="/trade" className="h-10 rounded-lg border border-zinc-300 px-4 leading-10 text-zinc-700 transition hover:bg-zinc-50">返回交易</Link>
          </div>
        </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item) => (
            <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <Link href={`/detail/${item.id}`}>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="h-48 w-full rounded-xl object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">暂无图片</div>
                )}
                <h3 className="mt-3 font-semibold text-zinc-900">{item.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{item.detail || "暂无描述"}</p>
                <p className="mt-2 text-base font-semibold text-emerald-700">¥{String(item.price)}</p>
              </Link>
            </article>
          ))}
          {(name.trim() || tag.trim()) && list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">未找到匹配商品</div>
          )}
        </div>
      </div>
    </main>
  );
}
