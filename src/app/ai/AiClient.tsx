"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Msg = { id: string; role: "user" | "assistant"; content: string; time: string };

export default function AiClient() {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "你好！我是你的 AI 环保助手，欢迎咨询垃圾分类、节能减排和低碳生活问题。",
      time: "刚刚",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const raf = window.requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [messages, loading]);

  const send = async () => {
    if (loading) return;
    const q = input.trim();
    if (!q) return;
    setError("");
    const now = new Date().toLocaleTimeString("zh-CN");
    const userId = `u_${Date.now()}`;
    const assistantId = `a_${Date.now()}`;

    const nextMessages = [
      ...messages,
      { id: userId, role: "user", content: q, time: now } as Msg,
      { id: assistantId, role: "assistant", content: "", time: new Date().toLocaleTimeString("zh-CN") } as Msg,
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }))
      .slice(-12);

    try {
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ message: q, history }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        let msg = 'AI 请求失败';
        try {
          const parsed = JSON.parse(text) as { msg?: string; error?: { message?: string } };
          msg = parsed?.msg || parsed?.error?.message || msg;
        } catch {
          if (text.trim()) {
            msg = text.trim();
          }
        }
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith("data:")) continue;

          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;

          try {
            const json = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
            const delta = json.choices?.[0]?.delta?.content || "";
            if (!delta) continue;
            accumulated += delta;
          } catch {
            accumulated += payload;
          }

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
          );
        }
      }

      if (!accumulated) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: "抱歉，暂时没有生成内容。" } : m))
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI 响应失败";
      setError(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "抱歉，当前服务不可用，请稍后重试。" }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div ref={listRef} className="h-[60vh] space-y-3 overflow-y-auto rounded-xl bg-zinc-50 p-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-zinc-900 text-white" : "bg-white text-zinc-800 border border-zinc-200"}`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              <p className={`mt-1 text-[11px] ${m.role === "user" ? "text-zinc-300" : "text-zinc-500"}`}>{m.time}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-500">AI 正在生成中...</div>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="输入你的环保问题..."
          className="h-10 flex-1 rounded-lg border border-zinc-300 px-3"
        />
        <button disabled={!canSend || loading} onClick={send} className="h-10 rounded-lg bg-black px-4 text-white disabled:opacity-50">
          {loading ? "生成中..." : "发送"}
        </button>
      </div>
    </section>
  );
}
