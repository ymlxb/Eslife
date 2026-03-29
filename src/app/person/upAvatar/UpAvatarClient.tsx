"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { currentAvatar: string };

export default function UpAvatarClient({ currentAvatar }: Props) {
  const router = useRouter();
  const [avatar, setAvatar] = useState(currentAvatar);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/users/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok || data.code !== 0) {
      setError(data.msg || "修改失败");
      return;
    }

    router.push("/person/userInfo");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-zinc-600">当前头像</p>
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="avatar" className="h-24 w-24 rounded-full border border-zinc-200 object-cover" />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-zinc-200 text-sm text-zinc-400">无头像</div>
      )}

      <div>
        <label className="mb-1 block text-sm text-zinc-600">头像 URL</label>
        <input value={avatar} onChange={(e) => setAvatar(e.target.value)} className="h-10 w-full rounded-lg border border-zinc-300 px-3" placeholder="请输入图片 URL" required />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-zinc-300 px-4 py-2">取消</button>
        <button disabled={loading} className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60">{loading ? "提交中..." : "保存"}</button>
      </div>
    </form>
  );
}
