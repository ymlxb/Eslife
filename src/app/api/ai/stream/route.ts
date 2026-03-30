import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRole = "system" | "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ code: 1, msg: "服务端未配置 DEEPSEEK_API_KEY" }, { status: 500 });
  }

  const body = await request.json();
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const historyInput = Array.isArray(body?.history) ? body.history : [];

  if (!message) {
    return NextResponse.json({ code: 1, msg: "消息不能为空" }, { status: 400 });
  }

  const history: ChatMessage[] = historyInput
    .map((item: unknown) => {
      if (!item || typeof item !== "object") return null;
      const r = (item as { role?: unknown }).role;
      const c = (item as { content?: unknown }).content;
      if ((r !== "system" && r !== "user" && r !== "assistant") || typeof c !== "string") return null;
      return { role: r, content: c.trim() } as ChatMessage;
    })
    .filter((item: ChatMessage | null): item is ChatMessage => !!item && !!item.content)
    .slice(-20);

  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const upstream = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "你是绿色生活助手，回答需准确、简洁、可执行。",
        },
        ...history,
        { role: "user", content: message },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json({ code: 1, msg: text || "DeepSeek 请求失败" }, { status: 500 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
