"use client";

import { useEffect, useMemo, useState } from "react";

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
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const meData = await meRes.json();
      if (!meRes.ok || meData.code !== 0) return;
      setMeId(meData.data.id);

      const usersRes = await fetch("/api/users/list", { cache: "no-store" });
      const usersData = await usersRes.json();
      if (usersRes.ok && usersData.code === 0) {
        setUsers(usersData.data || []);
        if (!activeUserId && usersData.data?.length > 0) {
          setActiveUserId(usersData.data[0].id);
        }
      }
    };
    boot();
  }, [activeUserId]);

  useEffect(() => {
    if (!activeUserId) return;

    const loadMessages = async () => {
      const res = await fetch(`/api/chat/messages?toUserId=${activeUserId}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.code === 0) {
        setMessages(data.data || []);
      }
    };

    loadMessages();
    const timer = setInterval(loadMessages, 3000);
    return () => clearInterval(timer);
  }, [activeUserId]);

  const send = async () => {
    if (!content.trim() || !activeUserId) return;
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: activeUserId, content: content.trim() }),
    });
    const data = await res.json();
    if (res.ok && data.code === 0) {
      setContent("");
      setMessages((prev) => [...prev, data.data]);
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
