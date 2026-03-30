"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/http";
import PlantLoading from "@/components/PlantLoading";

type PostItem = {
  id: number;
  title: string;
  createdAt: string;
  category: { name: string };
  excerpt: string | null;
};

export default function PostPublishClient() {
  const [list, setList] = useState<PostItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const fetchList = async (page = currentPage, size = pageSize) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        mine: "1",
        currentPage: String(page),
        pageSize: String(size),
      });
      if (keyword.trim()) {
        params.set("title", keyword.trim());
      }

      const res = await apiRequest<{
        code: number;
        msg?: string;
        data?: { list?: PostItem[]; total?: number };
      }>({
        url: `/api/posts?${params.toString()}`,
        method: "GET",
      });

      if (!res.ok || res.data.code !== 0) {
        setError(res.data.msg || "获取帖子列表失败");
        return;
      }

      setList(res.data.data?.list || []);
      setTotal(res.data.data?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const onSearch = () => {
    setCurrentPage(1);
    fetchList(1, pageSize);
  };

  const deletePost = async (id: number) => {
    const ok = window.confirm("确定要删除该帖子吗？");
    if (!ok) return;

    const res = await apiRequest<{ code: number; msg?: string }>({
      url: `/api/posts/${id}`,
      method: "DELETE",
    });
    if (!res.ok || res.data.code !== 0) {
      setError(res.data.msg || "删除失败");
      return;
    }

    fetchList();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <input
          placeholder="搜索帖子标题"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          className="h-10 w-full max-w-sm rounded-lg border border-zinc-300 px-3"
        />
        <button onClick={onSearch} className="h-10 rounded-lg bg-black px-4 text-white">
          搜索
        </button>
        <Link href="/community" className="h-10 rounded-lg border border-zinc-300 px-4 leading-10">
          去社区
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-2 py-2">标题</th>
              <th className="px-2 py-2">分类</th>
              <th className="px-2 py-2">发布时间</th>
              <th className="px-2 py-2">摘要</th>
              <th className="px-2 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-2 py-8 text-center text-zinc-500">
                  <PlantLoading compact text="帖子记录生长中..." />
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-8 text-center text-zinc-500">
                  暂无帖子
                </td>
              </tr>
            ) : (
              list.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100 align-top">
                  <td className="px-2 py-3 font-medium">
                    <Link href={`/detail/${item.id}?type=post`} className="hover:underline">
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-2 py-3">{item.category?.name || "-"}</td>
                  <td className="px-2 py-3">{new Date(item.createdAt).toLocaleString("zh-CN")}</td>
                  <td className="px-2 py-3 text-zinc-600">{item.excerpt || "-"}</td>
                  <td className="px-2 py-3">
                    <button onClick={() => deletePost(item.id)} className="text-red-600 hover:underline">
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
        <span className="text-zinc-500">共 {total} 条</span>
        <select
          value={pageSize}
          onChange={(e) => {
            const size = Number(e.target.value);
            setPageSize(size);
            setCurrentPage(1);
          }}
          className="h-9 rounded border border-zinc-300 px-2"
        >
          {[10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}/页
            </option>
          ))}
        </select>
        <button
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="h-9 rounded border border-zinc-300 px-3 disabled:opacity-40"
        >
          上一页
        </button>
        <span>
          {currentPage} / {totalPages}
        </span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className="h-9 rounded border border-zinc-300 px-3 disabled:opacity-40"
        >
          下一页
        </button>
      </div>
    </section>
  );
}
