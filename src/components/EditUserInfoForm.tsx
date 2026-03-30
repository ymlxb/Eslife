"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest } from "@/lib/http";

type Props = {
  username: string;
  nickname?: string | null;
  gender?: number | null;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
};

export default function EditUserInfoForm(props: Props) {
  const router = useRouter();
  const [nickname, setNickname] = useState(props.nickname || "");
  const [gender, setGender] = useState(props.gender ?? -1);
  const [mobile, setMobile] = useState(props.mobile || "");
  const [email, setEmail] = useState(props.email || "");
  const [address, setAddress] = useState(props.address || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest<{ code: number; msg?: string }>({
        url: "/api/users/me",
        method: "PATCH",
        data: {
          nickname,
          gender: gender === -1 ? null : gender,
          mobile,
          email,
          address,
        },
      });
      if (!res.ok || res.data.code !== 0) {
        setError(res.data.msg || "修改失败");
        return;
      }
      router.push("/person/userInfo");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm text-zinc-500">用户名</label>
        <input value={props.username} disabled className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-500">昵称</label>
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-500">性别</label>
        <select value={gender} onChange={(e) => setGender(Number(e.target.value))} className="w-full rounded-lg border border-zinc-300 px-3 py-2">
          <option value={-1}>未设置</option>
          <option value={0}>男</option>
          <option value={1}>女</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-500">电话</label>
        <input value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-500">邮箱</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-500">地址</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => router.push("/person/userInfo")} className="rounded-lg border border-zinc-300 px-4 py-2">取消</button>
        <button disabled={loading} className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60">{loading ? "提交中..." : "提交"}</button>
      </div>
    </form>
  );
}
