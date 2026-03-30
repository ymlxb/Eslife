"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [meId, setMeId] = useState<number>(0);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [activeUserId, setActiveUserId] = useState<number>(initialToUserId || 0);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [content, setContent] = useState("");

  const activeUser = useMemo(() => users.find((u) => u.id === activeUserId) || null, [users, activeUserId]);

  useEffect(() => {
    const boot = async () => {
      const meRes = await apiRequest<{ code: number; data?: { id: number } }>({
        url: "/api/auth/me",
        method: "GET",
      });
      if (!meRes.ok || meRes.data.code !== 0 || !meRes.data.data) return;
      setMeId(meRes.data.data.id);

      const usersRes = await apiRequest<{ code: number; data?: UserItem[] }>({
        url: "/api/users/list",
        method: "GET",
      });
      if (usersRes.ok && usersRes.data.code === 0) {
        setUsers(usersRes.data.data || []);
        if (!activeUserId && usersRes.data.data?.length) {
          setActiveUserId(usersRes.data.data[0].id);
        }
      }
    };
    boot();
  }, [activeUserId]);

  useEffect(() => {
    if (!activeUserId) return;

    const loadMessages = async () => {
      const res = await apiRequest<{ code: number; data?: MessageItem[] }>({
        url: `/api/chat/messages?toUserId=${activeUserId}`,
        method: "GET",
      });
      if (res.ok && res.data.code === 0) {
        setMessages(res.data.data || []);
      }
    };

    loadMessages();
    const timer = setInterval(loadMessages, 3000);
    return () => clearInterval(timer);
  }, [activeUserId]);

  const send = async () => {
    if (!content.trim() || !activeUserId) return;
    const res = await apiRequest<{ code: number; data?: MessageItem }>({
      url: "/api/chat/messages",
      method: "POST",
      data: { toUserId: activeUserId, content: content.trim() },
    });
    if (res.ok && res.data.code === 0 && res.data.data) {
      setContent("");
      setMessages((prev) => [...prev, res.data.data as MessageItem]);
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
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
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
            {messages.length === 0 && <p className="text-sm text-zinc-500">暂无消息</p>}
          </div>

          <footer className="flex gap-2 border-t border-zinc-200 p-3">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="输入消息..."
              className="h-10 flex-1 rounded-lg border border-zinc-300 px-3"
            />
            <button onClick={send} className="h-10 rounded-lg bg-black px-4 text-white">发送</button>
          </footer>
        </section>
      </div>
    </main>
  );
}
