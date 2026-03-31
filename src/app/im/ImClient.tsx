"use client";

import Image from "next/image";
import Pusher from "pusher-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/http";
import PlantLoading from "@/components/PlantLoading";
import VirtualList, { type VirtualListHandle } from "@/components/VirtualList";

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
  const messageListRef = useRef<VirtualListHandle | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const meIdRef = useRef(0);
  const meUsernameRef = useRef("");
  const userByIdRef = useRef<Map<number, UserItem>>(new Map());
  const userByUsernameRef = useRef<Map<string, UserItem>>(new Map());
  const activeUserIdRef = useRef(initialToUserId || 0);
  const messageReqSeqRef = useRef(0);

  const activeUser = useMemo(() => users.find((u) => u.id === activeUserId) || null, [users, activeUserId]);
  const userById = useMemo(() => {
    const map = new Map<number, UserItem>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

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
    userByIdRef.current = new Map(users.map((u) => [u.id, u] as const));
    userByUsernameRef.current = new Map(users.map((u) => [u.username, u] as const));
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
      pusherRef.current?.disconnect();
      pusherRef.current = null;
    };
    // 仅在初始化时拉取用户关系
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!meId || !activeUserId) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!pusherKey || !pusherCluster) {
      setError("Pusher 配置缺失，请检查环境变量");
      return;
    }

    setWsConnecting(true);
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: "/api/pusher/auth",
    });
    pusherRef.current = pusher;

    const channelName = `private-chat-${Math.min(meId, activeUserId)}-${Math.max(meId, activeUserId)}`;
    const channel = pusher.subscribe(channelName);

    const onConnected = () => {
      setWsConnecting(false);
      setWsOnline(true);
      setError("");
    };
    const onConnecting = () => {
      setWsConnecting(true);
      setWsOnline(false);
    };
    const onDisconnected = () => {
      setWsConnecting(false);
      setWsOnline(false);
    };
    const onError = () => {
      setWsConnecting(false);
      setWsOnline(false);
      setError("Pusher 连接失败，请稍后重试");
    };

    pusher.connection.bind("connected", onConnected);
    pusher.connection.bind("connecting", onConnecting);
    pusher.connection.bind("disconnected", onDisconnected);
    pusher.connection.bind("error", onError);

    channel.bind("chat-message", (payload: { fromUserId: number; toUserId: number; content: string; id?: number; createdAt?: string }) => {
      if (!payload?.content || !payload?.fromUserId || !payload?.toUserId) return;

      const inCurrentDialog =
        (payload.fromUserId === meIdRef.current && payload.toUserId === activeUserIdRef.current) ||
        (payload.fromUserId === activeUserIdRef.current && payload.toUserId === meIdRef.current);

      if (!inCurrentDialog) {
        if (payload.toUserId === meIdRef.current) {
          setUnreadMap((prev) => ({
            ...prev,
            [payload.fromUserId]: (prev[payload.fromUserId] || 0) + 1,
          }));
        }
        return;
      }

      appendMessage({
        id: Number(payload.id) || Date.now(),
        fromUserId: payload.fromUserId,
        toUserId: payload.toUserId,
        content: payload.content,
        createdAt: payload.createdAt || new Date().toISOString(),
      });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.connection.unbind("connected", onConnected);
      pusher.connection.unbind("connecting", onConnecting);
      pusher.connection.unbind("disconnected", onDisconnected);
      pusher.connection.unbind("error", onError);
      pusher.disconnect();
      if (pusherRef.current === pusher) {
        pusherRef.current = null;
      }
    };
  }, [meId, activeUserId, wsRetryKey]);

  useEffect(() => {
    if (!activeUserId) return;

    const loadMessages = async () => {
      const reqId = ++messageReqSeqRef.current;
      setLoading(true);
      const res = await apiRequest<{ code: number; data?: MessageItem[] }>({
        url: `/api/chat/messages?toUserId=${activeUserId}`,
        method: "GET",
      });
      if (reqId !== messageReqSeqRef.current) {
        return;
      }
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
    const raf = window.requestAnimationFrame(() => {
      messageListRef.current?.scrollToEnd("smooth");
    });

    return () => window.cancelAnimationFrame(raf);
  }, [messages, activeUserId]);

  const send = async () => {
    if (!content.trim() || !activeUserId || sending) return;
    setSending(true);
    const text = content.trim();
    try {
      const res = await apiRequest<{ code: number; data?: MessageItem }>({
        url: "/api/chat/messages",
        method: "POST",
        data: { toUserId: activeUserId, content: text },
      });

      if (res.ok && res.data.code === 0 && res.data.data) {
        appendMessage(res.data.data);
        setContent("");
        setError("");
        return;
      }
      setError("发送失败，请稍后重试");
    } catch {
      setError("发送失败，请稍后重试");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="h-screen overflow-hidden bg-[#f4efe6] p-5 md:p-6">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-3">
      <div className="shrink-0 flex items-center justify-between rounded-2xl border border-[#e1d5c6] bg-[#fcfaf6] px-4 py-2.5 shadow-[0_10px_28px_-22px_rgba(90,76,58,0.5)]">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="rounded-lg border border-[#d1c1ab] bg-white px-3 py-1.5 text-sm text-[#5f4a3f] hover:bg-[#f8f1e8]">
            返回
          </button>
          <button onClick={() => router.push("/home")} className="rounded-lg border border-[#d1c1ab] bg-white px-3 py-1.5 text-sm text-[#5f4a3f] hover:bg-[#f8f1e8]">
            去首页
          </button>
          <button onClick={() => router.push("/trade")} className="rounded-lg border border-[#d1c1ab] bg-white px-3 py-1.5 text-sm text-[#5f4a3f] hover:bg-[#f8f1e8]">
            去交易
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-flex rounded-full px-2 py-0.5 ${wsOnline ? "bg-[#e9f2e5] text-[#57704f]" : wsConnecting ? "bg-[#f6eddc] text-[#8a6f3f]" : "bg-[#e6ddd1] text-[#7b6d60]"}`}>
            {wsOnline ? "Pusher在线" : wsConnecting ? "连接中..." : "Pusher离线"}
          </span>
          {!wsOnline && (
            <button
              onClick={() => setWsRetryKey((k) => k + 1)}
              className="rounded-lg border border-[#d1c1ab] bg-white px-2 py-1 text-[#5f4a3f] hover:bg-[#f8f1e8]"
            >
              重连
            </button>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr] gap-4 overflow-hidden">
        <aside className="min-h-0 overflow-y-auto rounded-2xl border border-[#e1d5c6] bg-[#fcfaf6] p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#5f4a3f]">联系人</h2>
            <span className="rounded-full bg-[#f1e8dc] px-2 py-0.5 text-xs text-[#7b6d60]">{users.length} 人</span>
          </div>
          <div className="space-y-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setActiveUserId(u.id);
                  setUnreadMap((prev) => ({ ...prev, [u.id]: 0 }));
                }}
                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${activeUserId === u.id ? "border-[#c8d7c1] bg-[#edf5ea] text-[#43583d]" : "border-[#efe6da] bg-[#fffaf3] text-[#6f6257] hover:bg-[#f5ede1]"}`}
              >
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-[#d8cab7] bg-[#f7efe2]">
                  {u.avatar ? (
                    <Image src={u.avatar} alt={u.username} width={28} height={28} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-[#7c6e61]">
                      {(u.displayName || u.nickname || u.username).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="flex-1 truncate">{u.displayName || u.nickname || u.username}</span>
                {(unreadMap[u.id] || 0) > 0 && (
                  <span className="rounded-full bg-[#b96f59] px-1.5 py-0.5 text-[10px] text-white">{unreadMap[u.id]}</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e1d5c6] bg-[#fcfaf6]">
          <header className="shrink-0 flex items-center justify-between border-b border-[#eadfce] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 overflow-hidden rounded-full border border-[#d8cab7] bg-[#f7efe2]">
                {activeUser?.avatar ? (
                  <Image src={activeUser.avatar} alt={activeUser.username} width={36} height={36} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#7c6e61]">
                    {(activeUser?.displayName || activeUser?.nickname || activeUser?.username || "-").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[#4f4137]">{activeUser ? activeUser.displayName || activeUser.nickname || activeUser.username : "-"}</p>
                <p className="text-xs text-[#8a7a6c]">实时聊天</p>
              </div>
            </div>

            {error && <p className="text-xs text-[#9a5f3f]">{error}</p>}
          </header>

          <VirtualList
            ref={messageListRef}
            items={messages}
            itemKey={(item) => item.id}
            estimateSize={(item) => 64 + Math.min(180, item.content.length * 0.45)}
            overscan={10}
            className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-[#f7f0e4] to-[#fcfaf6] p-4"
            empty={!loading ? <p className="text-sm text-[#8a7a6c]">暂无消息</p> : undefined}
            renderItem={(m) => {
              const mine = m.fromUserId === meId;
              const sender = userById.get(m.fromUserId) || null;
              const avatarUrl = mine ? meAvatar : sender?.avatar || null;
              const fallbackText = mine
                ? (meUsername || "U").slice(0, 1).toUpperCase()
                : (sender?.displayName || sender?.nickname || sender?.username || "U").slice(0, 1).toUpperCase();

              return (
                <div className="pb-3">
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#d8cab7] bg-[#f7efe2]">
                        {avatarUrl ? (
                          <Image src={avatarUrl} alt="avatar" width={32} height={32} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#7c6e61]">{fallbackText}</div>
                        )}
                      </div>

                      <div className={`max-w-[70%] rounded-2xl border px-3 py-2 text-sm ${mine ? "border-[#c3a58a] bg-[#e7d5c4] text-[#4a3b32]" : "border-[#ceddc8] bg-[#edf5ea] text-[#3f4f3c]"}`}>
                        {m.content}
                        <div className={`mt-1 text-[11px] ${mine ? "text-[#7b6558]" : "text-[#6e7e67]"}`}>
                          {new Date(m.createdAt).toLocaleTimeString("zh-CN")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          {loading && <div className="px-4 pb-3"><PlantLoading compact text="消息萌发中..." /></div>}

          <footer className="shrink-0 flex gap-2 border-t border-[#eadfce] p-3">
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
              className="h-10 flex-1 rounded-lg border border-[#d9cab7] bg-white px-3 text-[#4f4137]"
            />
            <button onClick={() => void send()} disabled={sending || !activeUserId} className="h-10 rounded-lg bg-[#5f7b57] px-4 text-white disabled:opacity-60">
              {sending ? "发送中..." : "发送"}
            </button>
          </footer>
        </section>
      </div>
      </div>
    </main>
  );
}
