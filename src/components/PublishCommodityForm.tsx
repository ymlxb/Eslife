"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/http";

export default function PublishCommodityForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tags = ["数码", "服饰鞋帽", "家具电器", "家居生活", "图书音像", "宠物花卉", "文玩玉翠", "汽摩生活", "运动健身", "美容彩妆", "模玩动漫", "其他"];

  const previewItems = useMemo(
    () =>
      files.map((file) => ({
        key: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previewItems.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previewItems]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;

    const invalidType = selected.some((file) => !/^image\/(jpeg|jpg|png|webp|jfif)$/i.test(file.type));
    if (invalidType) {
      setError("图片必须是 jpg、png、webp 或 jfif 格式");
      event.target.value = "";
      return;
    }

    const oversize = selected.some((file) => file.size > 2 * 1024 * 1024);
    if (oversize) {
      setError("单张图片大小不能超过 2MB");
      event.target.value = "";
      return;
    }

    setFiles((prev) => {
      if (prev.length >= 5) {
        setError("最多上传 5 张图片");
        return prev;
      }

      const available = 5 - prev.length;
      const toAdd = selected.slice(0, available);

      if (selected.length > available) {
        setError(`最多上传 5 张图片，已为你追加 ${toAdd.length} 张`);
      } else {
        setError("");
      }

      return [...prev, ...toAdd];
    });

    event.target.value = "";
  };

  const removeFile = (target: File) => {
    setFiles((prev) =>
      prev.filter(
        (file) =>
          !(file.name === target.name && file.size === target.size && file.lastModified === target.lastModified)
      )
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!/^1[3-9]\d{9}$/.test(mobile.trim())) {
        setError("请输入正确的联系电话");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError("请输入正确的邮箱地址");
        return;
      }

      if (files.length === 0) {
        setError("请上传至少一张物品照片");
        return;
      }

      const uploadFormData = new FormData();
      files.forEach((file) => uploadFormData.append("files", file));

      const uploadRes = await apiRequest<{ code: number; msg?: string; data?: { urls?: string[] } }>({
        url: "/api/uploads/commodity",
        method: "POST",
        data: uploadFormData,
      });

      if (!uploadRes.ok || uploadRes.data.code !== 0) {
        setError(uploadRes.data.msg || "图片上传失败");
        return;
      }

      const imageUrls = Array.isArray(uploadRes.data?.data?.urls) ? uploadRes.data.data.urls : [];
      if (imageUrls.length === 0) {
        setError("图片上传失败，请重试");
        return;
      }

      const res = await apiRequest<{ code: number; msg?: string }>({
        url: "/api/commodities",
        method: "POST",
        data: {
          name,
          price: Number(price),
          tag,
          description,
          mobile,
          email,
          imageUrls,
        },
      });

      if (!res.ok || res.data.code !== 0) {
        setError(res.data.msg || "发布失败");
        return;
      }

      setName("");
      setPrice("");
      setTag("");
      setDescription("");
      setMobile("");
      setEmail("");
      setFiles([]);
      router.refresh();
      router.push("/trade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-emerald-100 bg-white/95 p-5 shadow-sm backdrop-blur">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">发布闲置商品</h3>
        <p className="mt-1 text-xs text-zinc-500">名称、价格、类型、描述、电话、邮箱、照片。</p>
      </div>

      <label className="grid gap-1 text-sm text-zinc-600">
        商品名称
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：95新机械键盘"
          className="rounded-lg border border-zinc-300 px-3 py-2 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          required
        />
      </label>

      <label className="grid gap-1 text-sm text-zinc-600">
        价格
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="例如：399"
          type="number"
          min="0"
          step="0.01"
          className="rounded-lg border border-zinc-300 px-3 py-2 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          required
        />
      </label>

      <label className="grid gap-1 text-sm text-zinc-600">
        物品类型
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          required
        >
          <option value="">请选择商品类型</option>
          {tags.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm text-zinc-600">
        物品描述
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="请输入物品描述（长度 20~100）"
          className="rounded-lg border border-zinc-300 px-3 py-2 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          rows={4}
          minLength={20}
          maxLength={100}
          required
        />
      </label>

      <label className="grid gap-1 text-sm text-zinc-600">
        联系电话
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="请输入联系电话"
          className="rounded-lg border border-zinc-300 px-3 py-2 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          required
        />
      </label>

      <label className="grid gap-1 text-sm text-zinc-600">
        邮箱地址
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="请输入邮箱地址"
          className="rounded-lg border border-zinc-300 px-3 py-2 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          required
        />
      </label>

      <label className="grid gap-1 text-sm text-zinc-600">
        物品照片（最多 5 张，每张 ≤ 2MB）
        <input
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/jfif"
          onChange={handleFileChange}
          className="rounded-lg border border-zinc-300 px-3 py-2 outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-emerald-700 hover:file:bg-emerald-100"
        />
      </label>

      {previewItems.length > 0 && (
        <p className="text-xs text-zinc-500">已选择 {previewItems.length} 张图片，可继续添加。</p>
      )}

      {previewItems.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {previewItems.map((item, index) => (
            <div key={item.key} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={`preview-${index + 1}`} className="h-24 w-full rounded-lg border border-zinc-200 object-cover" />
              <button
                type="button"
                onClick={() => removeFile(item.file)}
                className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.push("/trade")}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-700 transition hover:bg-zinc-50"
        >
          取消发布
        </button>
        <button disabled={loading} className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 font-medium text-white shadow-sm transition hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60">
          {loading ? "发布中..." : "立即发布"}
        </button>
      </div>
    </form>
  );
}
