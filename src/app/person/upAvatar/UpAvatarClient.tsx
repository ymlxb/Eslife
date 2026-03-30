"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest } from "@/lib/http";

type Props = { currentAvatar: string };

export default function UpAvatarClient({ currentAvatar }: Props) {
  const router = useRouter();
  const [avatar, setAvatar] = useState(currentAvatar);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(currentAvatar);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setPreview(avatar || currentAvatar);
      return;
    }

    if (!/^image\/(jpeg|jpg|png|webp|jfif)$/i.test(selected.type)) {
      setError("图片必须是 jpg、png、webp 或 jfif 格式");
      return;
    }

    if (selected.size > 2 * 1024 * 1024) {
      setError("图片大小不能超过 2MB");
      return;
    }

    setError("");
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let nextAvatar = avatar;

    if (file) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const uploadRes = await apiRequest<{ code: number; msg?: string; data?: { url?: string } }>({
        url: "/api/uploads/avatar",
        method: "POST",
        data: uploadFormData,
      });

      if (!uploadRes.ok || uploadRes.data.code !== 0) {
        setLoading(false);
        setError(uploadRes.data.msg || "头像上传失败");
        return;
      }

      nextAvatar = uploadRes.data.data?.url || "";
    }

    if (!nextAvatar) {
      setLoading(false);
      setError("请先选择头像图片");
      return;
    }

    const res = await apiRequest<{ code: number; msg?: string }>({
      url: "/api/users/avatar",
      method: "PATCH",
      data: { avatar: nextAvatar },
    });
    setLoading(false);

    if (!res.ok || res.data.code !== 0) {
      setError(res.data.msg || "修改失败");
      return;
    }

    setAvatar(nextAvatar);

    router.push("/person/userInfo");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#e4d8c8] bg-[#fcfaf6] p-6 shadow-sm">
      <p className="text-sm text-[#7d6f63]">当前头像</p>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="avatar" className="h-24 w-24 rounded-full border border-[#d6c6b3] object-cover" />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#d6c6b3] bg-[#f2e9dd] text-sm text-[#8e7e70]">无头像</div>
      )}

      <div>
        <label className="mb-1 block text-sm text-[#7d6f63]">上传新头像（单张，≤2MB）</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/jfif"
          onChange={handleFileChange}
          className="h-10 w-full rounded-lg border border-[#d9cab7] bg-white px-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#eef4eb] file:px-3 file:py-1.5 file:text-[#58734f]"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-[#d1c1ab] bg-white px-4 py-2 text-[#5f4a3f]">取消</button>
        <button disabled={loading} className="rounded-lg bg-[#5f7b57] px-4 py-2 text-white disabled:opacity-60">{loading ? "提交中..." : "保存"}</button>
      </div>
    </form>
  );
}
