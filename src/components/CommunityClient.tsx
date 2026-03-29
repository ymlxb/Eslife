"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string };
type PostItem = {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  createdAt: string;
  category: Category;
  user: { id: number; username: string; displayName: string | null; nickname: string | null };
};

type Props = {
  currentUserId: number;
  categories: Category[];
  posts: PostItem[];
};

export default function CommunityClient({ currentUserId, categories, posts }: Props) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id ?? 0);
  const [error, setError] = useState("");

  const filtered = useMemo(
    () => (active === 0 ? posts : posts.filter((p) => p.category.id === active)),
    [active, posts]
  );

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, categoryId }),
    });
    const data = await res.json();
    if (!res.ok || data.code !== 0) {
      setError(data.msg || "发布失败");
      return;
    }
    setShow(false);
    setTitle("");
    setContent("");
    router.refresh();
  };

  const deletePost = async (id: number) => {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || data.code !== 0) {
      setError(data.msg || "删除失败");
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setActive(0)} className={`rounded-full px-3 py-1 text-sm ${active === 0 ? "bg-black text-white" : "bg-zinc-100"}`}>全部</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActive(c.id)} className={`rounded-full px-3 py-1 text-sm ${active === c.id ? "bg-black text-white" : "bg-zinc-100"}`}>
              {c.name}
            </button>
          ))}
          <button onClick={() => setShow(true)} className="ml-auto rounded-full bg-emerald-600 px-4 py-1 text-sm text-white">发布新话题</button>
        </div>
      </div>

      {filtered.map((post) => (
        <article key={post.id} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {post.category.name} · {post.user.displayName || post.user.nickname || post.user.username} · {new Date(post.createdAt).toLocaleString("zh-CN")}
              </p>
              <p className="mt-3 text-sm text-zinc-700">{post.excerpt || post.content.slice(0, 120)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push(`/detail/${post.id}?type=post`)} className="rounded-lg border border-zinc-300 px-3 py-1 text-sm">详情</button>
              {post.user.id === currentUserId && (
                <button onClick={() => deletePost(post.id)} className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600">删除</button>
              )}
            </div>
          </div>
        </article>
      ))}

      {filtered.length === 0 && <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">暂无帖子</div>}

      {show && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <form onSubmit={createPost} className="w-full max-w-xl space-y-3 rounded-2xl bg-white p-5">
            <h3 className="text-lg font-semibold">发布新帖</h3>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="标题" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="w-full rounded-lg border border-zinc-300 px-3 py-2">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} required placeholder="内容" rows={6} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShow(false)} className="rounded-lg border border-zinc-300 px-4 py-2">取消</button>
              <button className="rounded-lg bg-black px-4 py-2 text-white">发布</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
