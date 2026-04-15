"use client";

import { Fragment, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import VirtualList, { type VirtualListHandle } from "@/components/VirtualList";

type Msg = { id: string; role: "user" | "assistant"; content: string; time: string };

type SecondhandCriteria = {
  keyword?: string;
  priceMin?: number;
  priceMax?: number;
  limit: number;
};

type ToolItem = {
  id: number;
  title: string;
  price: number;
  category: string;
  publish_time: string;
  detail: string;
  seller_name: string;
};

type FrontendToolContext = {
  tool: "secondhand";
  ok: boolean;
  summary: string;
  data: {
    criteria: SecondhandCriteria;
    items: ToolItem[];
  };
};

const CHAT_STORAGE_KEY = "eco-ai-chat-history-v1";
const WELCOME_MESSAGE: Msg = {
  id: "welcome",
  role: "assistant",
  content: "你好！我是你的 AI 环保助手，欢迎咨询垃圾分类、节能减排和低碳生活问题。",
  time: "刚刚",
};

const QUICK_ACTIONS = [
  "推荐几款2000元以下的二手笔记本",
  "如何把厨房垃圾减量 30%？",
  "给我一份一周低碳通勤建议",
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

function hasSecondhandKeyword(text: string): boolean {
  return /(二手|闲置|转卖|二手商品|商品列表|secondhand|价格|多少钱|预算|筛选|找|书|书籍|教材|耳机|手机|电脑|笔记本|元以内|以下|以上|不超过)/.test(text.toLowerCase());
}

function isSecondhandFollowup(text: string): boolean {
  return /(再|继续|刚才|上一个|上一条|前面|这些|这批|换成|改成|只看|便宜点|更便宜|贵一点|提高预算|再来|来\s*\d+\s*(个|条|件)?)/.test(text);
}

function extractSecondhandPartialCriteria(message: string) {
  const rangeMatch = message.match(/(\d{2,8})\s*[-到至~]\s*(\d{2,8})/);
  const maxOnlyMatch = message.match(/(不超过|以内|以下)\s*(\d{2,8})/);
  const amountThenLimitMatch = message.match(/(\d{1,8})\s*元?\s*(以下|以内|不超过)/);
  const minOnlyMatch = message.match(/(\d{1,8})\s*元?\s*(以上|起|及以上)/);
  const firstNMatch = message.match(/前\s*(\d{1,2})\s*(个|条|件)?/);
  const nItemsMatch = message.match(/(\d{1,2})\s*(个|条|件)/);

  let priceMin: number | undefined;
  let priceMax: number | undefined;
  let limit: number | undefined;

  if (rangeMatch) {
    priceMin = Number(rangeMatch[1]);
    priceMax = Number(rangeMatch[2]);
  } else if (amountThenLimitMatch) {
    priceMax = Number(amountThenLimitMatch[1]);
  } else if (maxOnlyMatch) {
    priceMax = Number(maxOnlyMatch[2]);
  } else if (minOnlyMatch) {
    priceMin = Number(minOnlyMatch[1]);
  }

  if (firstNMatch) {
    limit = Math.max(1, Math.min(20, Number(firstNMatch[1])));
  } else if (nItemsMatch) {
    limit = Math.max(1, Math.min(20, Number(nItemsMatch[1])));
  }

  const keyword = /书籍|图书|书本|书|教材|教辅|小说/.test(message)
    ? "书"
    : /笔记本|电脑|macbook/i.test(message)
      ? "笔记本"
      : /手机|iphone|安卓/i.test(message)
        ? "手机"
        : /耳机|键盘|鼠标|平板|手表|相机|显示器/.test(message)
          ? message.match(/耳机|键盘|鼠标|平板|手表|相机|显示器/)?.[0]
          : undefined;

  return { keyword, priceMin, priceMax, limit };
}

function resolveSecondhandCriteria(message: string, messages: Msg[]): SecondhandCriteria {
  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content).slice(-6);
  const merged: SecondhandCriteria = { limit: 6 };

  for (const text of [...userMessages, message]) {
    const partial = extractSecondhandPartialCriteria(text);
    if (partial.keyword) merged.keyword = partial.keyword;
    if (partial.priceMin !== undefined) merged.priceMin = partial.priceMin;
    if (partial.priceMax !== undefined) merged.priceMax = partial.priceMax;
    if (partial.limit !== undefined) merged.limit = partial.limit;
  }

  const currentPartial = extractSecondhandPartialCriteria(message);
  if (/再便宜点|更便宜|便宜一些/.test(message) && currentPartial.priceMax === undefined && merged.priceMax !== undefined) {
    merged.priceMax = Math.max(1, Math.floor(merged.priceMax * 0.8));
  }

  if (/贵一点|提高预算|放宽预算/.test(message) && currentPartial.priceMax === undefined && merged.priceMax !== undefined) {
    merged.priceMax = Math.max(1, Math.floor(merged.priceMax * 1.2));
  }

  if (/不限价格|不看价格|价格不限/.test(message)) {
    merged.priceMin = undefined;
    merged.priceMax = undefined;
  }

  return merged;
}

async function buildFrontendToolContext(message: string, messages: Msg[]): Promise<FrontendToolContext | null> {
  const hasHistorySecondhand = messages.filter((m) => m.role === "user").slice(-6).some((m) => hasSecondhandKeyword(m.content));
  if (!hasSecondhandKeyword(message) && !(isSecondhandFollowup(message) && hasHistorySecondhand)) {
    return null;
  }

  const criteria = resolveSecondhandCriteria(message, messages);
  const query = new URLSearchParams();
  if (criteria.keyword) query.set("q", criteria.keyword);
  query.set("order", "asc");

  const res = await fetch(`/api/commodities?${query.toString()}`);
  if (!res.ok) {
    return {
      tool: "secondhand",
      ok: false,
      summary: "前端工具调用失败",
      data: {
        criteria,
        items: [],
      },
    };
  }

  const json = (await res.json().catch(() => null)) as { code?: number; data?: Array<Record<string, unknown>> } | null;
  const source = Array.isArray(json?.data) ? json.data : [];

  const filtered = source.filter((item) => {
    const price = Number(item.price);
    if (Number.isNaN(price)) return false;
    if (criteria.priceMin !== undefined && price < criteria.priceMin) return false;
    if (criteria.priceMax !== undefined && price > criteria.priceMax) return false;
    return true;
  });

  const items: ToolItem[] = filtered.slice(0, criteria.limit).map((item) => ({
    id: Number(item.id) || 0,
    title: String(item.name ?? ""),
    price: Number(item.price),
    category: String(item.tag ?? "未分类"),
    publish_time: typeof item.createdAt === "string" ? item.createdAt.slice(0, 10) : "",
    detail: String(item.detail ?? ""),
    seller_name: String(((item.seller as Record<string, unknown> | undefined)?.displayName ?? (item.seller as Record<string, unknown> | undefined)?.username ?? "")),
  }));

  return {
    tool: "secondhand",
    ok: true,
    summary: items.length > 0 ? `共命中 ${items.length} 条` : "未命中数据",
    data: {
      criteria,
      items,
    },
  };
}

export default function AiClient() {
  const listRef = useRef<VirtualListHandle | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME_MESSAGE]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) {
        setHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        setHydrated(true);
        return;
      }

      const restored = parsed
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const obj = item as Partial<Msg>;
          if ((obj.role !== "user" && obj.role !== "assistant") || typeof obj.content !== "string") {
            return null;
          }
          return {
            id: typeof obj.id === "string" ? obj.id : `${obj.role}_${Date.now()}`,
            role: obj.role,
            content: obj.content,
            time: typeof obj.time === "string" ? obj.time : "刚刚",
          } as Msg;
        })
        .filter((item): item is Msg => !!item);

      setMessages(restored.length > 0 ? restored : [WELCOME_MESSAGE]);
    } catch {
      setMessages([WELCOME_MESSAGE]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const toSave = messages.slice(-80);
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // ignore storage errors
    }
  }, [messages, hydrated]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      listRef.current?.scrollToEnd("smooth");
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
      const toolContext = await buildFrontendToolContext(q, messages);
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ message: q, history, toolContext }),
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

      <VirtualList
        ref={listRef}
        items={messages}
        itemKey={(item) => item.id}
        estimateSize={(item) => 72 + Math.min(280, item.content.length * 0.45)}
        overscan={10}
        className="relative min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#ddd1be] bg-[#f9f5ee]/90 p-4 md:p-5"
        renderItem={(m) => (
          <div className="eco-float-in pb-3">
            <div className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl border px-3.5 py-2.5 text-sm leading-6 md:max-w-[78%] ${m.role === "user" ? "border-[#c3a58a] bg-[#e7d5c4] text-[#4a3b32]" : "border-[#ceddc8] bg-[#edf5ea] text-[#3f4f3c]"}`}>
                {m.role === "assistant" ? (
                  <div>{renderMarkdown(m.content)}</div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
                <p className={`mt-1 text-[11px] ${m.role === "user" ? "text-[#7b6558]" : "text-[#6e7e67]"}`}>{m.time}</p>
              </div>
            </div>
          </div>
        )}
      />

      {loading && (
        <div className="mt-2 flex justify-start">
          <div className="flex items-center gap-2 rounded-xl border border-[#ceddc8] bg-[#edf5ea] px-3 py-2 text-xs text-[#5d7058]">
            <span className="eco-breathe h-2 w-2 rounded-full bg-[#7da079]" />
            AI 正在生成绿色建议...
          </div>
        </div>
      )}

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
