"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [wsOnline, setWsOnline] = useState(false);
  const [meId, setMeId] = useState<number>(0);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [activeUserId, setActiveUserId] = useState<number>(initialToUserId || 0);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const meIdRef = useRef(0);
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
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  useEffect(() => {
    const boot = async () => {
      setError("");
      const meRes = await apiRequest<{ code: number; data?: { id: number } }>({
        url: "/api/auth/me",
        method: "GET",
      });
      if (!meRes.ok || meRes.data.code !== 0 || !meRes.data.data) {
        setError("登录已失效，请重新登录");
        router.push("/login");
        return;
      }
      setMeId(meRes.data.data.id);

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

      await apiRequest({ url: "/api/socket", method: "GET" });
      const nextSocket = io(window.location.origin, {
        path: "/api/socket",
        transports: ["websocket"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1200,
      });

      nextSocket.on("connect", () => {
        setWsOnline(true);
        setError("");
      });

      nextSocket.on("disconnect", () => {
        setWsOnline(false);
      });

      nextSocket.on("connect_error", (err) => {
        setWsOnline(false);
        setError(`WebSocket 连接失败：${err.message || "未知错误"}`);
      });

      nextSocket.on("chat:new", (msg: MessageItem) => {
        const currentMeId = meIdRef.current;
        const currentActiveUserId = activeUserIdRef.current;
        const inCurrentDialog =
          (msg.fromUserId === currentMeId && msg.toUserId === currentActiveUserId) ||
          (msg.fromUserId === currentActiveUserId && msg.toUserId === currentMeId);

        if (inCurrentDialog) {
          appendMessage(msg);
        }
      });

      setSocket(nextSocket);
      socketRef.current = nextSocket;
    };
    void boot();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // 仅在初始化时拉取用户关系
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const send = async () => {
    if (!content.trim() || !activeUserId || sending || !socket) return;
    console.log('socket',socket);
    
    if (!socket.connected) {
      setError("WebSocket 未连接，请稍后重试");
      return;
    }

    setSending(true);
    const sendingContent = content.trim();

    const timeout = window.setTimeout(() => {
      setSending(false);
      setError("发送超时，请重试");
    }, 5000);

    socket.emit("chat:send", { toUserId: activeUserId, content: content.trim() }, (ack: { code: number; msg?: string }) => {
      clearTimeout(timeout);
      if (ack?.code !== 0) {
        setError(ack?.msg || "发送失败，请稍后重试");
        setSending(false);
        return;
      }

      setContent("");
      setError("");
      setSending(false);
    });

    if (!sendingContent) {
      clearTimeout(timeout);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-100 p-6">
      <div className="mx-auto grid h-[calc(100vh-3rem)] max-w-6xl grid-cols-[260px_1fr] gap-4">
        <aside className="rounded-2xl bg-white p-3">
          <h2 className="mb-3 text-base font-semibold">联系人</h2>
          <div className="space-y-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setActiveUserId(u.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${activeUserId === u.id ? "bg-zinc-900 text-white" : "bg-zinc-100"}`}
              >
                {u.displayName || u.nickname || u.username}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex flex-col rounded-2xl bg-white">
          <header className="border-b border-zinc-200 px-4 py-3 text-sm text-zinc-600">
            与 {activeUser ? activeUser.displayName || activeUser.nickname || activeUser.username : "-"} 聊天中
            <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs ${wsOnline ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"}`}>
              {wsOnline ? "WebSocket在线" : "WebSocket离线"}
            </span>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {loading && <p className="text-sm text-zinc-500">消息加载中...</p>}
            {messages.map((m) => {
              const mine = m.fromUserId === meId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-800"}`}>
                    {m.content}
                    <div className={`mt-1 text-[11px] ${mine ? "text-emerald-100" : "text-zinc-500"}`}>
                      {new Date(m.createdAt).toLocaleTimeString("zh-CN")}
                    </div>
                  </div>
                </div>
              );
            })}
            {!loading && messages.length === 0 && <p className="text-sm text-zinc-500">暂无消息</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <footer className="flex gap-2 border-t border-zinc-200 p-3">
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
            <button onClick={() => void send()} disabled={sending} className="h-10 rounded-lg bg-black px-4 text-white disabled:opacity-60">
              {sending ? "发送中..." : "发送"}
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}
