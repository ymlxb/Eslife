"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/http";
import PlantLoading from "@/components/PlantLoading";

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
    <main
      className="relative min-h-screen overflow-hidden px-4 py-6 md:px-8"
      style={{
        background: "linear-gradient(135deg, #efe4d5 0%, #e8ddce 40%, #dce8de 100%)",
        fontFamily: "Inter, SF Pro Text, SF Pro Display, system-ui, -apple-system, sans-serif",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-45" style={{ background: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.7), rgba(255,255,255,0) 38%), radial-gradient(circle at 80% 80%, rgba(123,156,126,0.25), rgba(123,156,126,0) 40%)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(rgba(90,110,88,0.2) 0.6px, transparent 0.6px)", backgroundSize: "12px 12px" }} />

      <section className="relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/60 bg-white/35 shadow-[0_20px_46px_rgba(74,66,54,0.18)] backdrop-blur-[2px] lg:grid-cols-5">
        <div className="relative hidden lg:col-span-3 lg:block">
          <div className="absolute inset-0 p-10">
            <div className="flex h-full flex-col rounded-[28px] border border-[#eadfce] bg-white/70 p-8">
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-[#d7cab8] bg-white px-4 py-2 text-[#4f4137] shadow-sm">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3a5e4c] to-[#7b9c7e] text-white">🌿</span>
                <span className="text-lg font-semibold tracking-wide">绿脉永续</span>
              </div>

              <h2 className="mt-6 text-4xl font-semibold leading-tight text-[#3f4037]">与自然一起生活</h2>
              <p className="mt-3 text-base text-[#6f665d]">低碳、循环、可持续。</p>

              <div className="relative mt-8 flex-1 overflow-hidden rounded-[24px] border border-[#e8ddcf] bg-gradient-to-b from-[#f4efe7] via-[#edf3ea] to-[#e7efe7] shadow-inner">
                <div className="absolute left-10 top-8 h-14 w-14 rounded-full bg-[#f6e7b9] shadow-[0_0_0_10px_rgba(246,231,185,0.22)]" />
                <div className="absolute left-8 top-20 h-2 w-12 rounded-full bg-white/55" />
                <div className="absolute right-16 top-14 h-2 w-16 rounded-full bg-white/45" />

                <div className="absolute left-[22%] top-8 h-6 w-4 rounded-[100%_0_100%_0] bg-[#87a989]/70" style={{ animation: "floatLeaf 6s ease-in-out infinite" }} />
                <div className="absolute left-[35%] top-16 h-5 w-3 rounded-[100%_0_100%_0] bg-[#6f916f]/70" style={{ animation: "floatLeaf 5.5s ease-in-out 1s infinite" }} />
                <div className="absolute right-[18%] top-10 h-6 w-4 rounded-[0_100%_0_100%] bg-[#7b9c7e]/70" style={{ animation: "floatLeaf 6.2s ease-in-out 0.6s infinite" }} />

                <div className="absolute -left-12 bottom-24 h-44 w-[72%] rounded-[50%] bg-[#cfe0d0]" />
                <div className="absolute right-[-30px] bottom-20 h-40 w-[64%] rounded-[50%] bg-[#bfd4c2]" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-[#c4a484]/65" />

                <div className="absolute left-[20%] bottom-20 h-20 w-2 rounded-full bg-[#5a7f62]" />
                <div className="absolute left-[17%] bottom-[148px] h-8 w-8 rounded-[100%_0_100%_0] bg-[#6f916f] -rotate-12" />
                <div className="absolute left-[20%] bottom-[144px] h-8 w-8 rounded-[0_100%_0_100%] bg-[#5f7f5f] rotate-12" />

                <div className="absolute left-[44%] bottom-[98px] h-14 w-14 rounded-full border-4 border-[#4c6953] border-t-transparent border-r-transparent" />
                <div className="absolute left-[48%] bottom-[102px] h-2 w-2 rounded-full bg-[#4c6953]" />
                <div className="absolute left-[52%] bottom-[97px] h-2 w-2 rounded-full bg-[#4c6953]" />

                <div className="absolute left-[57%] bottom-[106px] h-20 w-3 rounded-full bg-[#6d8f72]" style={{ animation: "growTree 2.8s ease-out" }} />
                <div className="absolute left-[55%] bottom-[140px] h-9 w-9 rounded-[100%_0_100%_0] bg-[#7b9c7e] -rotate-12" />
                <div className="absolute left-[58%] bottom-[136px] h-9 w-9 rounded-[0_100%_0_100%] bg-[#5f7b57] rotate-12" />

                <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-[#6f665d]">开启绿色旅程</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 sm:p-6 lg:col-span-2">
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-[#efe6db] bg-white/95 p-6 shadow-[0_14px_36px_rgba(71,92,77,0.14)] sm:p-8">
            <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#dbe8da] blur-2xl" />
            <div className="mb-6 flex rounded-full bg-[#f2ece3] p-1">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`h-10 flex-1 rounded-full text-sm font-medium transition-all duration-300 ${isLogin ? "bg-white text-[#355744] shadow" : "text-[#7b6b5a]"}`}
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`h-10 flex-1 rounded-full text-sm font-medium transition-all duration-300 ${!isLogin ? "bg-white text-[#355744] shadow" : "text-[#7b6b5a]"}`}
              >
                注册
              </button>
            </div>

            <h1 className="mb-1 text-2xl font-semibold text-[#3f4037]">{isLogin ? "欢迎回来" : "创建账号"}</h1>
            <p className="mb-6 text-sm text-[#857766]">{isLogin ? "继续你的绿色旅程" : "加入绿脉永续，开始低碳行动"}</p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-[#7c6b5a]">用户名</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#d8cab7] bg-white px-3 text-[#3f4037] outline-none transition-all duration-300 focus:border-[#5f7b57] focus:shadow-[0_0_0_4px_rgba(95,123,87,0.14)]"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-[#7c6b5a]">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#d8cab7] bg-white px-3 text-[#3f4037] outline-none transition-all duration-300 focus:border-[#5f7b57] focus:shadow-[0_0_0_4px_rgba(95,123,87,0.14)]"
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="mb-1.5 block text-sm text-[#7c6b5a]">确认密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#d8cab7] bg-white px-3 text-[#3f4037] outline-none transition-all duration-300 focus:border-[#5f7b57] focus:shadow-[0_0_0_4px_rgba(95,123,87,0.14)]"
                    required
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                disabled={loading}
                className="relative h-11 w-full overflow-hidden rounded-full bg-[#3a5e4c] text-sm font-medium text-white transition-all duration-300 hover:bg-[#2f4e3f] hover:shadow-[0_10px_20px_rgba(58,94,76,0.24)] disabled:opacity-60"
              >
                <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/20 blur-md" style={{ animation: "shine 2.8s linear infinite" }} />
                {loading ? "正在生长中..." : isLogin ? "登录" : "注册"}
              </button>

              {loading && <PlantLoading compact text="正在播种绿色希望..." />}
            </form>

            <button
              onClick={() => setIsLogin((v) => !v)}
              className="mt-4 w-full text-sm text-[#6e6357] underline transition-colors duration-300 hover:text-[#3f4037]"
            >
              {isLogin ? "没有账号？去注册" : "已有账号？去登录"}
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes floatLeaf {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.65;
          }
          50% {
            transform: translateY(10px) rotate(10deg);
            opacity: 1;
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-180%);
          }
          100% {
            transform: translateX(420%);
          }
        }

        @keyframes growTree {
          from {
            transform: scaleY(0.75);
            transform-origin: bottom;
            opacity: 0.4;
          }
          to {
            transform: scaleY(1);
            transform-origin: bottom;
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
