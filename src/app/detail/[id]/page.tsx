"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

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

export default function DetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const type = search.get("type") || "commodity";
  const [item, setItem] = useState<CommodityDetail | PostDetail | null>(null);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const run = async () => {
      const endpoint = type === "post" ? `/api/posts?postId=${params.id}` : `/api/commodities/${params.id}`;
      const res = await fetch(endpoint, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data.code !== 0) {
        setError(data.msg || "加载失败");
        return;
      }
      if (type === "post") {
        const matched = (data.data || []).find((p: PostDetail) => String(p.id) === params.id);
        setItem(matched || null);
      } else {
        setItem(data.data);
        setActiveImageIndex(0);
      }
    };
    run();
  }, [params.id, type]);

  const deleteCommodity = async () => {
    const res = await fetch(`/api/commodities/${params.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || data.code !== 0) {
      setError(data.msg || "删除失败");
      return;
    }
    router.push("/trade");
    router.refresh();
  };

  if (error) {
    return <main className="p-8 text-red-600">{error}</main>;
  }

  if (!item) {
    return <main className="p-8">加载中...</main>;
  }

  if (type === "post") {
    const post = item as PostDetail;
    return (
      <main className="mx-auto max-w-4xl p-6">
        <button onClick={() => router.back()} className="mb-4 rounded border px-3 py-1">返回</button>
        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">{post.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            {post.category.name} · {post.user.displayName || post.user.nickname || post.user.username} · {new Date(post.createdAt).toLocaleString("zh-CN")}
          </p>
          <div className="mt-6 whitespace-pre-wrap leading-7 text-zinc-700">{post.content}</div>
        </article>
      </main>
    );
  }

  const commodity = item as CommodityDetail;
  const imageUrls = commodity.imageUrls && commodity.imageUrls.length > 0 ? commodity.imageUrls : commodity.imageUrl ? [commodity.imageUrl] : [];
  const activeImage = imageUrls[activeImageIndex] || imageUrls[0] || null;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <button onClick={() => router.back()} className="mb-4 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50">返回</button>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            {activeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeImage} alt={commodity.name} className="h-80 w-full rounded-lg object-contain" />
            ) : (
              <div className="flex h-80 items-center justify-center text-zinc-400">暂无图片</div>
            )}

            {imageUrls.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {imageUrls.map((url, index) => (
                  <button
                    key={url + index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`overflow-hidden rounded-lg border ${index === activeImageIndex ? "border-emerald-400" : "border-zinc-200"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`thumb-${index + 1}`} className="h-14 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{commodity.name}</h1>
            <p className="mt-2 text-2xl font-bold text-emerald-700">¥{commodity.price.toString()}</p>
            {commodity.tag && <p className="mt-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">{commodity.tag}</p>}
            <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">{commodity.detail || "暂无描述"}</p>
            <div className="mt-6 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700">
              <p>卖家：{commodity.seller.displayName || commodity.seller.username}</p>
              <p>电话：{commodity.seller.mobile || "未填写"}</p>
              <p>邮箱：{commodity.seller.email || "未填写"}</p>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => router.push(`/im?toUserId=${commodity.seller.id}`)} className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50">
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
      </section>
    </main>
  );
}
