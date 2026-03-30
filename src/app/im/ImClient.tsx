"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/http";

type UserItem = {
  id: number;
  username: string;
  displayName: string | null;
  nickname: string | null;
  avatar: string | null;
};

type MessageItem = {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  createdAt: string;
};

type Props = {
  initialToUserId?: number;
};

export default function ImClient({ initialToUserId }: Props) {
  const router = useRouter();
  const [wsOnline, setWsOnline] = useState(false);
  const [wsConnecting, setWsConnecting] = useState(false);
  const [wsRetryKey, setWsRetryKey] = useState(0);
  const [meId, setMeId] = useState<number>(0);
  const [meUsername, setMeUsername] = useState("");
  const [meAvatar, setMeAvatar] = useState<string | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [activeUserId, setActiveUserId] = useState<number>(initialToUserId || 0);
  const [unreadMap, setUnreadMap] = useState<Record<number, number>>({});
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const meIdRef = useRef(0);
  const meUsernameRef = useRef("");
  const usersRef = useRef<UserItem[]>([]);
  const activeUserIdRef = useRef(initialToUserId || 0);

  const activeUser = useMemo(() => users.find((u) => u.id === activeUserId) || null, [users, activeUserId]);

  const appendMessage = (next: MessageItem) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === next.id)) {
        return prev;
      }
      return [...prev, next];
    });
  };

  useEffect(() => {
    meIdRef.current = meId;
  }, [meId]);

  useEffect(() => {
    meUsernameRef.current = meUsername;
  }, [meUsername]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  useEffect(() => {
    const boot = async () => {
      setError("");
      const meRes = await apiRequest<{ code: number; data?: { id: number; username: string; avatar?: string | null } }>({
        url: "/api/auth/me",
        method: "GET",
      });
      if (!meRes.ok || meRes.data.code !== 0 || !meRes.data.data) {
        setError("登录已失效，请重新登录");
        router.push("/login");
        return;
      }
      setMeId(meRes.data.data.id);
      setMeUsername(meRes.data.data.username || "");
      setMeAvatar(meRes.data.data.avatar || null);

      const usersRes = await apiRequest<{ code: number; data?: UserItem[] }>({
        url: "/api/users/list",
        method: "GET",
      });
      if (!usersRes.ok || usersRes.data.code !== 0) {
        setError("获取联系人失败");
        return;
      }

      const contactList = usersRes.data.data || [];
      setUsers(contactList);
      if (!activeUserId && contactList.length) {
        setActiveUserId(contactList[0].id);
      }
    };
    void boot();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
    // 仅在初始化时拉取用户关系
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!meUsername) return;

    const wsBase = process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8090";
    const wsUrl = `${wsBase}/chat/chat/${encodeURIComponent(meUsername)}`;
    setWsConnecting(true);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnecting(false);
      setWsOnline(true);
      setError("");
    };

    ws.onclose = (event) => {
      setWsConnecting(false);
      setWsOnline(false);
      if (!event.wasClean) {
        setError(`WebSocket 已断开(code=${event.code})，请确认聊天服务已启动：${wsBase}`);
      }
    };

    ws.onerror = () => {
      setWsConnecting(false);
      setWsOnline(false);
      setError(`WebSocket 连接失败，请确认聊天服务地址可用：${wsBase}`);
    };

    ws.onmessage = (event) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return;
      }

      const payload = parsed as { fromName?: string; toName?: string; content?: string; id?: number; createdAt?: string };
      if (!payload.fromName || !payload.toName || !payload.content) {
        return;
      }

      const fromUser = usersRef.current.find((u) => u.username === payload.fromName) || null;
      const toUser = usersRef.current.find((u) => u.username === payload.toName) || null;
      const activeUser = usersRef.current.find((u) => u.id === activeUserIdRef.current);
      const activeUsername = activeUser?.username || "";
      const currentMeName = meUsernameRef.current;

      const inCurrentDialog =
        (payload.fromName === currentMeName && payload.toName === activeUsername) ||
        (payload.fromName === activeUsername && payload.toName === currentMeName);

      if (!inCurrentDialog) {
        if (payload.toName === currentMeName && fromUser) {
          setUnreadMap((prev) => ({
            ...prev,
            [fromUser.id]: (prev[fromUser.id] || 0) + 1,
          }));
        }
        return;
      }

      appendMessage({
        id: Number(payload.id) || Date.now(),
        fromUserId: payload.fromName === currentMeName ? meIdRef.current : (fromUser?.id || activeUserIdRef.current),
        toUserId: payload.toName === currentMeName ? meIdRef.current : (toUser?.id || activeUserIdRef.current),
        content: payload.content,
        createdAt: payload.createdAt || new Date().toISOString(),
      });
    };

    return () => {
      ws.close();
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [meUsername, wsRetryKey]);

  useEffect(() => {
    if (!activeUserId) return;

    const loadMessages = async () => {
      setLoading(true);
      const res = await apiRequest<{ code: number; data?: MessageItem[] }>({
        url: `/api/chat/messages?toUserId=${activeUserId}`,
        method: "GET",
      });
      if (res.ok && res.data.code === 0) {
        setMessages(res.data.data || []);
        setError("");
      } else {
        setError("获取消息失败");
      }
      setLoading(false);
    };

    void loadMessages();
    return;
  }, [activeUserId]);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;

    const raf = window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [messages, activeUserId]);

  const send = async () => {
    if (!content.trim() || !activeUserId || sending || !wsRef.current) return;
    const ws = wsRef.current;
    if (ws.readyState !== WebSocket.OPEN) {
      setError("WebSocket 未连接，请稍后重试");
      return;
    }

    const activeUser = users.find((u) => u.id === activeUserId);
    if (!activeUser?.username || !meUsername) {
      setError("聊天对象异常，请重试");
      return;
    }

    setSending(true);
    const text = content.trim();
    try {
      ws.send(
        JSON.stringify({
          fromName: meUsername,
          toName: activeUser.username,
          content: text,
        })
      );
      setContent("");
      setError("");
    } catch {
      setError("发送失败，请稍后重试");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="h-screen overflow-hidden bg-zinc-100 p-6">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-3">
      <div className="shrink-0 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">
            返回
          </button>
          <button onClick={() => router.push("/home")} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">
            去首页
          </button>
          <button onClick={() => router.push("/trade")} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">
            去交易
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-flex rounded-full px-2 py-0.5 ${wsOnline ? "bg-emerald-100 text-emerald-700" : wsConnecting ? "bg-amber-100 text-amber-700" : "bg-zinc-200 text-zinc-600"}`}>
            {wsOnline ? "WebSocket在线" : wsConnecting ? "连接中..." : "WebSocket离线"}
          </span>
          {!wsOnline && (
            <button
              onClick={() => setWsRetryKey((k) => k + 1)}
              className="rounded-lg border border-zinc-300 px-2 py-1 text-zinc-700 hover:bg-zinc-50"
            >
              重连
            </button>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr] gap-4 overflow-hidden">
        <aside className="min-h-0 overflow-y-auto rounded-2xl bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">联系人</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{users.length} 人</span>
          </div>
          <div className="space-y-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setActiveUserId(u.id);
                  setUnreadMap((prev) => ({ ...prev, [u.id]: 0 }));
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${activeUserId === u.id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"}`}
              >
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-white">
                  {u.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatar} alt={u.username} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-zinc-600">
                      {(u.displayName || u.nickname || u.username).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="flex-1 truncate">{u.displayName || u.nickname || u.username}</span>
                {(unreadMap[u.id] || 0) > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{unreadMap[u.id]}</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white">
          <header className="shrink-0 flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                {activeUser?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeUser.avatar} alt={activeUser.username} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-600">
                    {(activeUser?.displayName || activeUser?.nickname || activeUser?.username || "-").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-800">{activeUser ? activeUser.displayName || activeUser.nickname || activeUser.username : "-"}</p>
                <p className="text-xs text-zinc-500">实时聊天</p>
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}
          </header>

          <div ref={messageListRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-zinc-50 to-white p-4">
            {loading && <p className="text-sm text-zinc-500">消息加载中...</p>}
            {messages.map((m) => {
              const mine = m.fromUserId === meId;
              const sender = users.find((u) => u.id === m.fromUserId) || null;
              const avatarUrl = mine ? meAvatar : sender?.avatar || null;
              const fallbackText = mine
                ? (meUsername || "U").slice(0, 1).toUpperCase()
                : (sender?.displayName || sender?.nickname || sender?.username || "U").slice(0, 1).toUpperCase();
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-600">{fallbackText}</div>
                      )}
                    </div>

                    <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-800"}`}>
                      {m.content}
                      <div className={`mt-1 text-[11px] ${mine ? "text-emerald-100" : "text-zinc-500"}`}>
                        {new Date(m.createdAt).toLocaleTimeString("zh-CN")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {!loading && messages.length === 0 && <p className="text-sm text-zinc-500">暂无消息</p>}
          </div>

          <footer className="shrink-0 flex gap-2 border-t border-zinc-200 p-3">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="输入消息..."
              className="h-10 flex-1 rounded-lg border border-zinc-300 px-3"
            />
            <button onClick={() => void send()} disabled={sending || !wsOnline} className="h-10 rounded-lg bg-black px-4 text-white disabled:opacity-60">
              {sending ? "发送中..." : "发送"}
            </button>
          </footer>
        </section>
      </div>
      </div>
    </main>
  );
}
