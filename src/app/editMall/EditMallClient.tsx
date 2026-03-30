"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/http";

type Props = { commodityId?: string };

type CommodityDetail = {
  id: number;
  name: string;
  detail: string | null;
  price: string | number;
  tag: string | null;
  imageUrl: string | null;
  imageUrls?: string[];
};

export default function EditMallClient({ commodityId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<CommodityDetail | null>(null);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tags = ["数码", "服饰鞋帽", "家具电器", "家居生活", "图书音像", "宠物花卉", "文玩玉翠", "汽摩生活", "运动健身", "美容彩妆", "模玩动漫", "其他"];

  const newPreviewUrls = useMemo(() => newFiles.map((file) => URL.createObjectURL(file)), [newFiles]);

  useEffect(() => {
    return () => {
      newPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPreviewUrls]);

  useEffect(() => {
    if (!commodityId) return;
    const load = async () => {
      const res = await apiRequest<{ code: number; msg?: string; data?: CommodityDetail & { imageUrls?: unknown[] } }>({
        url: `/api/commodities/${commodityId}`,
        method: "GET",
      });
      if (!res.ok || res.data.code !== 0 || !res.data.data) {
        setError(res.data.msg || "加载失败");
        return;
      }
      setData(res.data.data);
      const images = Array.isArray(res.data.data?.imageUrls)
        ? res.data.data.imageUrls.filter((item: unknown) => typeof item === "string") as string[]
        : res.data.data?.imageUrl
          ? [res.data.data.imageUrl]
          : [];
      setExistingImageUrls(images);
    };
    load();
  }, [commodityId]);

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

    setNewFiles((prev) => {
      const currentTotal = existingImageUrls.length + prev.length;
      if (currentTotal >= 5) {
        setError("最多保留 5 张图片，请先删除后再添加");
        return prev;
      }

      const available = 5 - currentTotal;
      const toAdd = selected.slice(0, available);

      if (selected.length > available) {
        setError(`最多保留 5 张图片，已为你追加 ${toAdd.length} 张`);
      } else {
        setError("");
      }

      return [...prev, ...toAdd];
    });

    event.target.value = "";
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (target: File) => {
    setNewFiles((prev) =>
      prev.filter(
        (file) =>
          !(file.name === target.name && file.size === target.size && file.lastModified === target.lastModified)
      )
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !commodityId) return;

    setLoading(true);

    let imageUrls = existingImageUrls;

    if (newFiles.length > 0) {
      const uploadFormData = new FormData();
      newFiles.forEach((file) => uploadFormData.append("files", file));

      const uploadRes = await apiRequest<{ code: number; msg?: string; data?: { urls?: string[] } }>({
        url: "/api/uploads/commodity",
        method: "POST",
        data: uploadFormData,
      });

      if (!uploadRes.ok || uploadRes.data.code !== 0) {
        setLoading(false);
        setError(uploadRes.data.msg || "图片上传失败");
        return;
      }

      const uploadedUrls = Array.isArray(uploadRes.data?.data?.urls) ? uploadRes.data.data.urls : [];
      imageUrls = [...existingImageUrls, ...uploadedUrls].slice(0, 5);
    }

    if (imageUrls.length === 0) {
      setLoading(false);
      setError("请至少保留一张商品图片");
      return;
    }

    const res = await apiRequest<{ code: number; msg?: string }>({
      url: `/api/commodities/${commodityId}`,
      method: "PATCH",
      data: {
        name: data.name,
        detail: data.detail,
        tag: data.tag,
        price: data.price,
        imageUrls,
      },
    });
    setLoading(false);

    if (!res.ok || res.data.code !== 0) {
      setError(res.data.msg || "修改失败");
      return;
    }

    router.push(`/detail/${commodityId}`);
    router.refresh();
  };

  if (!commodityId) {
    return <p className="text-sm text-red-600">缺少商品 ID</p>;
  }

  if (!data) {
    return <p className="text-sm text-zinc-500">加载中...</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">编辑商品信息</h2>
        <p className="mt-1 text-xs text-zinc-500">修改后会立即同步到交易列表与商品详情页。</p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-600">商品名称</label>
        <input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="h-10 w-full rounded-lg border border-zinc-300 px-3 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" required />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-600">价格</label>
        <input type="number" min={0} step="0.01" value={String(data.price)} onChange={(e) => setData({ ...data, price: Number(e.target.value) })} className="h-10 w-full rounded-lg border border-zinc-300 px-3 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" required />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-600">标签</label>
        <select
          value={data.tag || ""}
          onChange={(e) => setData({ ...data, tag: e.target.value })}
          className="h-10 w-full rounded-lg border border-zinc-300 px-3 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">请选择商品类型</option>
          {tags.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-600">描述</label>
        <textarea value={data.detail || ""} onChange={(e) => setData({ ...data, detail: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" rows={4} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-600">上传新图片（最多 5 张，每张 ≤ 2MB）</label>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/jfif"
          onChange={handleFileChange}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-emerald-700 hover:file:bg-emerald-100"
        />
      </div>

      <div>
        <p className="mb-2 text-xs text-zinc-500">当前保留图片（可删除）：</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {existingImageUrls.map((url, index) => (
            <div key={url + index} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`existing-${index + 1}`} className="h-24 w-full rounded-lg border border-zinc-200 object-cover" />
              <button
                type="button"
                onClick={() => removeExistingImage(index)}
                className="absolute right-1 top-1 rounded bg-red-500 px-1.5 py-0.5 text-xs text-white"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </div>

      {newPreviewUrls.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-zinc-500">待追加上传图片（{newPreviewUrls.length} 张）：</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {newPreviewUrls.map((url, index) => (
              <div key={url + index} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`new-preview-${index + 1}`} className="h-24 w-full rounded-lg border border-zinc-200 object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(newFiles[index])}
                  className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {newPreviewUrls.length === 0 && existingImageUrls.length === 0 && (
        <p className="text-sm text-amber-600">当前没有可用图片，请上传新图片。</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 transition hover:bg-zinc-50">取消</button>
        <button disabled={loading} className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-white transition hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60">{loading ? "保存中..." : "保存"}</button>
      </div>
    </form>
  );
}
