"use client";

import { Fragment, ReactNode, useEffect, useMemo, useRef, useState } from "react";

type Msg = { id: string; role: "user" | "assistant"; content: string; time: string };

const QUICK_ACTIONS = [
  "给我一份一周低碳通勤建议",
  "如何把厨房垃圾减量 30%？",
  "推荐 3 个家庭节水微习惯",
  "帮我做一个可持续购物清单",
];

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null = regex.exec(text);

  while (match) {
    const token = match[0];
    const start = match.index;
    if (start > last) {
      parts.push(text.slice(last, start));
    }

    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={`${start}-b`} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={`${start}-i`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code key={`${start}-c`} className="rounded bg-[#e9e1d2] px-1 py-0.5 text-[12px]">
          {token.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(token);
    }

    last = start + token.length;
    match = regex.exec(text);
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

function renderMarkdown(content: string): ReactNode {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    nodes.push(
      <ul key={`ul-${key}`} className="my-1 list-disc space-y-1 pl-5">
        {listBuffer.map((item, idx) => (
          <li key={`${key}-${idx}`}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    const listMatch = line.match(/^[-*]\s+(.*)$/);

    if (listMatch) {
      listBuffer.push(listMatch[1]);
      return;
    }

    flushList(String(idx));

    if (!line) {
      nodes.push(<div key={`br-${idx}`} className="h-2" />);
      return;
    }

    const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const title = hMatch[2];
      const titleClass =
        level <= 2
          ? "mt-1 text-[15px] font-semibold"
          : level === 3
            ? "mt-1 text-[14px] font-semibold"
            : "mt-1 text-[13px] font-medium";
      nodes.push(
        <p key={`h-${idx}`} className={titleClass}>
          {renderInline(title)}
        </p>
      );
      return;
    }

    nodes.push(
      <p key={`p-${idx}`} className="whitespace-pre-wrap leading-6">
        {renderInline(rawLine)}
      </p>
    );
  });

  flushList("end");
  return <Fragment>{nodes}</Fragment>;
}

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

  const applyQuickAction = (text: string) => {
    setInput(text);
  };

  return (
    <section className="eco-paper relative flex h-[calc(100vh-210px)] min-h-[560px] flex-col overflow-hidden rounded-[28px] border border-[#d4c8b6]/70 bg-[#f4efe4] p-4 shadow-[0_12px_36px_-20px_rgba(86,74,59,0.35)] md:h-[calc(100vh-200px)] md:p-5">
      <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[#7b9b77]/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-14 -left-8 h-40 w-40 rounded-full bg-[#b1825f]/10 blur-2xl" />

      {/* <div className="relative mb-3 rounded-2xl border border-[#d5c9b8] bg-[#f8f2e9]/85 px-4 py-3">
        <div>
          <p className="text-[13px] font-medium tracking-wide text-[#5f6e52]">亲生物对话空间</p>
          <h2 className="text-lg font-semibold text-[#5f4a3f]">温和 · 可靠 · 可持续</h2>
        </div>
      </div> */}

      <div ref={listRef} className="relative min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#ddd1be] bg-[#f9f5ee]/90 p-4 md:p-5">
        {messages.map((m) => (
          <div key={m.id} className={`eco-float-in flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl border px-3.5 py-2.5 text-sm leading-6 md:max-w-[78%] ${m.role === "user" ? "border-[#c3a58a] bg-[#e7d5c4] text-[#4a3b32]" : "border-[#ceddc8] bg-[#edf5ea] text-[#3f4f3c]"}`}>
              {m.role === "assistant" ? (
                <div>{renderMarkdown(m.content)}</div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
              <p className={`mt-1 text-[11px] ${m.role === "user" ? "text-[#7b6558]" : "text-[#6e7e67]"}`}>{m.time}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-xl border border-[#ceddc8] bg-[#edf5ea] px-3 py-2 text-xs text-[#5d7058]">
              <span className="eco-breathe h-2 w-2 rounded-full bg-[#7da079]" />
              AI 正在生成绿色建议...
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-3 rounded-xl border border-[#ddc9b5] bg-[#f8eee4] px-3 py-2 text-sm text-[#8b5f42]">{error}</p>}

      <div className="mt-3 rounded-2xl border border-[#d7cbb9] bg-[#f8f2e9]/90 p-3">
        <p className="mb-2 text-xs font-medium tracking-wide text-[#6f7d62]">可持续灵感 · 快捷入口</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => applyQuickAction(item)}
              className="rounded-full border border-[#cfdcc9] bg-[#edf5ea] px-3 py-1.5 text-xs text-[#4e6348] transition hover:border-[#9cb391] hover:bg-[#e4f0df]"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#d5c9b8] bg-[#f7efe2]/95 p-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="输入你的环保问题，开始一次温和的绿色对话..."
          className="h-11 flex-1 rounded-xl border border-[#d9ccba] bg-[#fffaf3] px-3 text-[#4a3f36] outline-none transition placeholder:text-[#978676] focus:border-[#8ea684]"
        />
        <button
          disabled={!canSend || loading}
          onClick={send}
          className="h-11 rounded-xl bg-[#6f8b66] px-4 text-sm font-medium text-white transition hover:bg-[#5f7b57] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "生成中..." : "发送"}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between rounded-xl border border-[#d7ccb9]/90 bg-[#f8f2e9]/80 px-3 py-2">
        <p className="text-xs text-[#7a6b5e]">循环经济进度 · 今日绿色行动建议闭环</p>
        <div className="flex items-end gap-1">
          <span className="eco-flow h-2 w-2 rounded-full bg-[#6f8b66]" />
          <span className="eco-flow h-2.5 w-2.5 rounded-full bg-[#89a07f] [animation-delay:0.15s]" />
          <span className="eco-flow h-3 w-3 rounded-full bg-[#9db192] [animation-delay:0.3s]" />
        </div>
      </div>
    </section>
  );
}
