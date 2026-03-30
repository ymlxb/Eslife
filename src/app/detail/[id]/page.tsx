"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { apiRequest } from "@/lib/http";
import PlantLoading from "@/components/PlantLoading";

type CommodityDetail = {
  id: number;
  name: string;
  detail: string | null;
  price: { toString(): string };
  tag: string | null;
  imageUrl: string | null;
  imageUrls?: string[];
  createdAt: string;
  canDelete?: boolean;
  seller: {
    id: number;
    username: string;
    displayName: string | null;
    mobile: string | null;
    email: string | null;
    avatar: string | null;
  };
};

type PostDetail = {
  id: number;
  title: string;
  content: string;
  excerpt: string | null;
  createdAt: string;
  category: { id: number; name: string };
  user: { id: number; username: string; displayName: string | null; nickname: string | null };
};

type RelatedCommodity = {
  id: number;
  name: string;
  price: number | string | { toString(): string };
  tag: string | null;
  imageUrl: string | null;
  imageUrls?: string[];
  seller?: {
    username: string;
    displayName: string | null;
  };
};

export default function DetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const id = params?.id;
  const type = search?.get("type") || "commodity";
  const [item, setItem] = useState<CommodityDetail | PostDetail | null>(null);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [relatedItems, setRelatedItems] = useState<RelatedCommodity[]>([]);

  useEffect(() => {
    if (!id) return;

    const run = async () => {
      const endpoint = type === "post" ? `/api/posts/${id}` : `/api/commodities/${id}`;
      const res = await apiRequest<{ code: number; msg?: string; data?: CommodityDetail | PostDetail }>({
        url: endpoint,
        method: "GET",
      });
      if (!res.ok || res.data.code !== 0) {
        setError(res.data.msg || "加载失败");
        return;
      }
      if (type === "post") {
        setItem((res.data.data as PostDetail) || null);
      } else {
        setItem((res.data.data as CommodityDetail) || null);
        setActiveImageIndex(0);
      }
    };
    run();
  }, [id, type]);

  useEffect(() => {
    if (type !== "commodity" || !item) return;

    const current = item as CommodityDetail;
    const run = async () => {
      const query = new URLSearchParams();
      if (current.tag) query.set("tag", current.tag);
      query.set("order", "desc");

      const res = await apiRequest<{ code: number; data?: RelatedCommodity[] }>({
        url: `/api/commodities?${query.toString()}`,
        method: "GET",
      });

      if (!res.ok || res.data.code !== 0) {
        setRelatedItems([]);
        return;
      }

      const list = (res.data.data || []).filter((c) => c.id !== current.id).slice(0, 4);
      setRelatedItems(list);
    };

    void run();
  }, [item, type]);

  const deleteCommodity = async () => {
    if (!id) return;

    const res = await apiRequest<{ code: number; msg?: string }>({
      url: `/api/commodities/${id}`,
      method: "DELETE",
    });
    if (!res.ok || res.data.code !== 0) {
      setError(res.data.msg || "删除失败");
      return;
    }
    router.push("/trade");
    router.refresh();
  };

  if (error) {
    return <main className="p-8 text-red-600">{error}</main>;
  }

  if (!item) {
    return (
      <main className="min-h-screen bg-zinc-100 p-8">
        <PlantLoading fullScreen text="详情页面培育中..." />
      </main>
    );
  }

  if (type === "post") {
    const post = item as PostDetail;
    return (
      <main className="min-h-screen bg-zinc-100">
        <div className="mx-auto max-w-4xl p-6">
          <button
            onClick={() => router.back()}
            className="mb-4 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            返回
          </button>

          <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-green-500 to-cyan-500 p-8 text-white shadow-lg">
            <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs tracking-wide">{post.category.name}</span>
            <h1 className="mt-4 text-3xl font-semibold leading-tight">{post.title}</h1>
            <p className="mt-3 text-sm text-emerald-50">
              {post.user.displayName || post.user.nickname || post.user.username} · {new Date(post.createdAt).toLocaleString("zh-CN")}
            </p>
          </section>

          <article className="mt-5 rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
            <div className="prose prose-zinc max-w-none leading-8 text-zinc-700" dangerouslySetInnerHTML={{ __html: post.content }} />
          </article>
        </div>
      </main>
    );
  }

  const commodity = item as CommodityDetail;
  const imageUrls = commodity.imageUrls && commodity.imageUrls.length > 0 ? commodity.imageUrls : commodity.imageUrl ? [commodity.imageUrl] : [];
  const activeImage = imageUrls[activeImageIndex] || imageUrls[0] || null;
  const detailParagraphs = (commodity.detail || "暂无描述")
    .split(/\n+/)
    .map((text) => text.trim())
    .filter(Boolean);
  const createdAtText = new Date(commodity.createdAt).toLocaleString("zh-CN");
  const sellerName = commodity.seller.displayName || commodity.seller.username;

  return (
    <main className="min-h-screen bg-zinc-100">
      <div className="mx-auto max-w-6xl p-6">
        <button onClick={() => router.back()} className="mb-4 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50">返回</button>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              {activeImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeImage} alt={commodity.name} className="h-96 w-full rounded-xl object-contain" />
              ) : (
                <div className="flex h-96 items-center justify-center text-zinc-400">暂无图片</div>
              )}

              {imageUrls.length > 1 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {imageUrls.map((url, index) => (
                    <button
                      key={url + index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`overflow-hidden rounded-lg border transition ${index === activeImageIndex ? "border-emerald-400 ring-2 ring-emerald-100" : "border-zinc-200 hover:border-zinc-300"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`thumb-${index + 1}`} className="h-16 w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                {commodity.tag && <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{commodity.tag}</span>}
                <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">发布时间：{createdAtText}</span>
              </div>

              <h1 className="mt-3 text-3xl font-semibold leading-tight text-zinc-900">{commodity.name}</h1>
              <p className="mt-2 text-3xl font-bold text-emerald-700">¥{commodity.price.toString()}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">交易方式</p>
                  <p className="mt-1 text-sm font-medium text-zinc-800">当面 / 协商</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">安全提示</p>
                  <p className="mt-1 text-sm font-medium text-zinc-800">先验货再付款</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">环保价值</p>
                  <p className="mt-1 text-sm font-medium text-zinc-800">促进循环利用</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                    {commodity.seller.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={commodity.seller.avatar} alt={sellerName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-600">{sellerName.slice(0, 1).toUpperCase()}</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{sellerName}</p>
                    <p className="text-xs text-zinc-500">诚信交易 · 绿色循环</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-zinc-700">
                  <p>电话：{commodity.seller.mobile || "未填写"}</p>
                  <p>邮箱：{commodity.seller.email || "未填写"}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => router.push(`/im?toUserId=${commodity.seller.id}`)} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white transition hover:bg-zinc-800">
                  联系卖家
                </button>
                {commodity.canDelete && (
                  <>
                    <button onClick={() => router.push(`/editMall?id=${commodity.id}`)} className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 transition hover:bg-sky-100">
                      修改商品
                    </button>
                    <button onClick={deleteCommodity} className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-600 transition hover:bg-red-100">
                      删除商品
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h2 className="text-base font-semibold text-zinc-900">商品详情</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-zinc-700">
                {detailParagraphs.length > 0 ? detailParagraphs.map((line, idx) => <p key={`${line}-${idx}`}>{line}</p>) : <p>暂无描述</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h2 className="text-base font-semibold text-zinc-900">交易与保障</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-700">
                <li>建议使用平台聊天确认商品成色、配件、交付方式。</li>
                <li>线下交易请选择公共场所，当面验货更安全。</li>
                <li>如发现信息不实，请保留证据并及时反馈。</li>
                <li>优先重复使用与维修，减少资源浪费，共建低碳社区。</li>
              </ul>
            </section>
          </div>

          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">相关推荐商品</h2>
              <button onClick={() => router.push("/trade")} className="text-sm text-emerald-700 hover:text-emerald-800">
                查看更多
              </button>
            </div>

            {relatedItems.length === 0 ? (
              <p className="text-sm text-zinc-500">暂无相关推荐，去交易页看看更多商品吧。</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {relatedItems.map((related) => {
                  const cover = related.imageUrls?.[0] || related.imageUrl;
                  const seller = related.seller?.displayName || related.seller?.username || "匿名卖家";
                  return (
                    <button
                      key={related.id}
                      onClick={() => router.push(`/detail/${related.id}?type=commodity`)}
                      className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 text-left transition hover:border-emerald-300 hover:bg-white"
                    >
                      <div className="h-32 w-full bg-zinc-100">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt={related.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-zinc-400">暂无图片</div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-2 text-sm font-medium text-zinc-900">{related.name}</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-700">¥{related.price.toString()}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                          <span className="truncate">{seller}</span>
                          <span>{related.tag || "闲置"}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
