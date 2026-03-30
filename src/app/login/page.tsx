"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/http";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isLogin && password !== confirmPassword) {
      setError("两次密码不一致");
      return;
    }

    setLoading(true);

    try {
      const url = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await apiRequest<{ code: number; msg?: string }>({
        url,
        method: "POST",
        data: { username, password },
      });

      if (!res.ok || res.data.code !== 0) {
        setError(res.data.msg || "操作失败");
        return;
      }

      if (isLogin) {
        router.push("/home");
        router.refresh();
      } else {
        setIsLogin(true);
        setConfirmPassword("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-6 text-center text-2xl font-semibold">
          {isLogin ? "登录" : "注册"}
        </h1>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-600">用户名</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-600">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm text-zinc-600">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                required
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-black py-2 text-white disabled:opacity-60"
          >
            {loading ? "处理中..." : isLogin ? "登录" : "注册"}
          </button>
        </form>

        <button
          onClick={() => setIsLogin((v) => !v)}
          className="mt-4 w-full text-sm text-zinc-600 underline"
        >
          {isLogin ? "没有账号？去注册" : "已有账号？去登录"}
        </button>
      </div>
    </main>
  );
}
