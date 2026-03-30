"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/http";
import WangEditor5 from "@/components/WangEditor5";
import PlantLoading from "@/components/PlantLoading";

type Category = { id: number; name: string };
type PostItem = {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  createdAt: string;
  category: Category;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    nickname: string | null;
    avatar: string | null;
  };
};

type Props = {
  currentUserId: number;
  categories: Category[];
  posts: PostItem[];
};

export default function CommunityClient({ currentUserId, categories, posts }: Props) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [mineOnly, setMineOnly] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [items, setItems] = useState<PostItem[]>(posts);
  const [total, setTotal] = useState(posts.length);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id ?? 0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const stripHtml = (html: string) =>
    html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        params.set("currentPage", String(currentPage));
        params.set("pageSize", String(pageSize));
        if (active > 0) {
          params.set("categoryId", String(active));
        }
        if (mineOnly) {
          params.set("mine", "1");
        }
        if (keyword) {
          params.set("title", keyword);
        }

        const res = await apiRequest<{
          code: number;
          msg?: string;
          data?: { list: PostItem[]; total: number };
        }>({
          url: `/api/posts?${params.toString()}`,
          method: "GET",
          signal: controller.signal,
        });

        if (!res.ok || res.data.code !== 0) {
          setError(res.data.msg || "加载帖子失败");
          return;
        }

        setItems(res.data.data?.list || []);
        setTotal(res.data.data?.total || 0);
      } catch {
        if (!controller.signal.aborted) {
          setError("加载帖子失败");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => controller.abort();
  }, [active, mineOnly, keyword, currentPage, refreshKey]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const plainText = stripHtml(content);
    if (!title.trim() || plainText.length < 5) {
      setError("请填写标题，且正文至少5个字");
      setSubmitting(false);
      return;
    }

    try {
      const res = await apiRequest<{ code: number; msg?: string }>({
        url: "/api/posts",
        method: "POST",
        data: { title, content, categoryId },
      });
      if (!res.ok || res.data.code !== 0) {
        setError(res.data.msg || "发布失败");
        return;
      }
      setShow(false);
      setTitle("");
      setContent("");
      setCurrentPage(1);
      setRefreshKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const deletePost = async (id: number) => {
    setError("");
    const ok = window.confirm("确定删除这个帖子吗？");
    if (!ok) {
      return;
    }

    const res = await apiRequest<{ code: number; msg?: string }>({
      url: `/api/posts/${id}`,
      method: "DELETE",
    });
    if (!res.ok || res.data.code !== 0) {
      setError(res.data.msg || "删除失败");
      return;
    }
    setCurrentPage(1);
    setRefreshKey((k) => k + 1);
  };

  const openPostDetail = (id: number) => {
    router.push(`/detail/${id}?type=post`);
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-green-500 to-cyan-500 p-7 text-white shadow-lg">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">绿色生活社区</h2>
            <p className="mt-2 text-sm text-emerald-50 md:text-base">分享低碳习惯、环保好物与日常经验，一起把生活变得更可持续。</p>
          </div>
          <button
            onClick={() => setShow(true)}
            className="w-fit rounded-full border border-white/40 bg-white/20 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/30"
          >
            发布新话题
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">帖子总数</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{total}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">当前分类</p>
          <p className="mt-2 text-base font-semibold text-zinc-900">{active === 0 ? "全部" : categories.find((c) => c.id === active)?.name || "全部"}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">筛选状态</p>
          <p className="mt-2 text-base font-semibold text-zinc-900">{mineOnly ? "仅看我的" : "全部用户"}</p>
        </div>
      </section>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setActive(0);
              setCurrentPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm transition ${active === 0 ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"}`}
          >
            全部
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActive(c.id);
                setCurrentPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-sm transition ${active === c.id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setKeyword(searchText.trim());
              setCurrentPage(1);
            }}
            className="flex w-full items-center gap-2"
          >
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索帖子标题"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
            />
            <button className="whitespace-nowrap rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">搜索</button>
          </form>

          <button
            onClick={() => {
              setMineOnly((v) => !v);
              setCurrentPage(1);
            }}
            className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm transition ${mineOnly ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"}`}
          >
            {mineOnly ? "仅看我的：开" : "仅看我的：关"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <PlantLoading compact text="帖子生长中..." />
        </div>
      )}

      {!loading &&
        items.map((post) => (
        <article
          key={post.id}
          role="button"
          tabIndex={0}
          onClick={() => openPostDetail(post.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPostDetail(post.id);
            }
          }}
          className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <div className="flex items-start gap-4">
            <div className="mt-0.5 h-12 w-12 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
              {post.user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.user.avatar} alt={post.user.username} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-600">
                  {(post.user.displayName || post.user.nickname || post.user.username).slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                <span className="inline-flex shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{post.category.name}</span>
                <span className="truncate">{post.title}</span>
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                {post.user.displayName || post.user.nickname || post.user.username} · {new Date(post.createdAt).toLocaleString("zh-CN")}
              </p>

              <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-700">{post.excerpt || post.content.slice(0, 140)}</p>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openPostDetail(post.id);
                  }}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
                >
                  查看详情
                </button>

                {post.user.id === currentUserId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePost(post.id);
                    }}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 opacity-80 transition hover:bg-red-50 hover:opacity-100"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          </div>
        </article>
        ))}

      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">暂无帖子，快来发布第一条内容吧。</div>
      )}

      {!loading && items.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-zinc-600">
            第 {currentPage} / {totalPages} 页
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {show && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form onSubmit={createPost} className="w-full max-w-2xl space-y-3 rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-900">发布新帖</h3>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              placeholder="请输入标题"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none transition focus:border-emerald-500"
            />
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="w-full rounded-lg border border-zinc-300 px-3 py-2">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <WangEditor5 value={content} onChange={setContent} placeholder="分享你的想法..." />

            <p className="text-xs text-zinc-500">当前正文字数：{stripHtml(content).length}</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShow(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700">
                取消
              </button>
              <button disabled={submitting} className="rounded-lg bg-zinc-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "发布中..." : "发布"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
