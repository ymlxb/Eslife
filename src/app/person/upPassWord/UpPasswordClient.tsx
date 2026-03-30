"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest } from "@/lib/http";

export default function UpPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    const res = await apiRequest<{ code: number; msg?: string }>({
      url: "/api/users/password",
      method: "PATCH",
      data: { password, newPassword },
    });
    setLoading(false);

    if (!res.ok || res.data.code !== 0) {
      setError(res.data.msg || "修改失败");
      return;
    }

    router.push("/person/userInfo");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#e4d8c8] bg-[#fcfaf6] p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm text-[#7d6f63]">原密码</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 w-full rounded-lg border border-[#d9cab7] bg-white px-3 text-[#4f4137]" required />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[#7d6f63]">新密码</label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-10 w-full rounded-lg border border-[#d9cab7] bg-white px-3 text-[#4f4137]" required />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[#7d6f63]">确认密码</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-10 w-full rounded-lg border border-[#d9cab7] bg-white px-3 text-[#4f4137]" required />
      </div>
      {error && <p className="rounded-lg border border-[#e5c8b4] bg-[#f9eee5] px-3 py-2 text-sm text-[#9a5f3f]">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-[#d1c1ab] bg-white px-4 py-2 text-[#5f4a3f]">取消</button>
        <button disabled={loading} className="rounded-lg bg-[#5f7b57] px-4 py-2 text-white disabled:opacity-60">{loading ? "提交中..." : "提交"}</button>
      </div>
    </form>
  );
}
