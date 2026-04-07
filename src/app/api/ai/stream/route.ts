import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRole = "system" | "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type IntentType = "carbon" | "secondhand" | "recommend";

type ToolRunResult = {
  tool: IntentType;
  ok: boolean;
  summary: string;
  data?: unknown;
};

type SecondhandItem = {
  id: number;
  title: string;
  price: number;
  category: string;
  publish_time: string;
  detail: string;
  seller_name: string;
};

type SecondhandSearchCriteria = {
  keyword?: string;
  priceMin?: number;
  priceMax?: number;
  limit: number;
};

type SecondhandPartialCriteria = {
  keyword?: string;
  priceMin?: number;
  priceMax?: number;
  limit?: number;
};

type FrontendToolContext = {
  tool: "secondhand";
  ok: boolean;
  summary: string;
  data?: {
    criteria?: SecondhandSearchCriteria;
    items?: SecondhandItem[];
  };
};

function hasSecondhandKeyword(text: string): boolean {
  return /(二手|闲置|转卖|二手商品|商品列表|secondhand|价格|多少钱|预算|筛选|找|书|书籍|教材|耳机|手机|电脑|笔记本|元以内|以下|以上|不超过)/.test(text.toLowerCase());
}

function isSecondhandFollowup(text: string): boolean {
  return /(再|继续|刚才|上一个|上一条|前面|这些|这批|换成|改成|只看|便宜点|更便宜|贵一点|提高预算|再来|来\s*\d+\s*(个|条|件)?)/.test(text);
}

function detectIntents(message: string, history: ChatMessage[]): IntentType[] {
  const text = message.toLowerCase();
  const intents: IntentType[] = [];

  const hasHistorySecondhand = history
    .filter((item) => item.role === "user")
    .slice(-6)
    .some((item) => hasSecondhandKeyword(item.content));

  if (hasSecondhandKeyword(text) || (isSecondhandFollowup(message) && hasHistorySecondhand)) {
    intents.push("secondhand");
  }

  return Array.from(new Set(intents));
}

function extractSecondhandPartialCriteria(message: string): SecondhandPartialCriteria {
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

  return {
    keyword,
    priceMin,
    priceMax,
    limit,
  };
}

function resolveSecondhandCriteria(message: string, history: ChatMessage[]): SecondhandSearchCriteria {
  const userMessages = history
    .filter((item) => item.role === "user")
    .map((item) => item.content)
    .slice(-6);

  const merged: SecondhandSearchCriteria = {
    limit: 6,
  };

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

async function runSecondhandTool(criteria: SecondhandSearchCriteria): Promise<ToolRunResult> {

  const list = await prisma.commodity.findMany({
    where: {
      AND: [
        criteria.keyword
          ? {
              OR: [
                { name: { contains: criteria.keyword } },
                { detail: { contains: criteria.keyword } },
                { tag: { contains: criteria.keyword } },
              ],
            }
          : {},
        criteria.priceMin !== undefined ? { price: { gte: criteria.priceMin } } : {},
        criteria.priceMax !== undefined ? { price: { lte: criteria.priceMax } } : {},
      ],
    },
    include: {
      seller: {
        select: {
          username: true,
          displayName: true,
        },
      },
    },
    orderBy: [{ price: "asc" }, { createdAt: "desc" }],
    take: criteria.limit,
  });

  const items: SecondhandItem[] = list.map((item) => ({
    id: item.id,
    title: item.name,
    price: Number(item.price),
    category: item.tag || "未分类",
    publish_time: item.createdAt.toISOString().slice(0, 10),
    detail: item.detail || "",
    seller_name: item.seller.displayName || item.seller.username,
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

async function buildDataSystemMessage(message: string, history: ChatMessage[], frontendToolContext: FrontendToolContext | null): Promise<string | null> {
  if (frontendToolContext?.tool === "secondhand") {
    const results: ToolRunResult[] = [
      {
        tool: "secondhand",
        ok: frontendToolContext.ok,
        summary: frontendToolContext.summary,
        data: frontendToolContext.data,
      },
    ];

    return `你是“可自主规划并调用工具”的绿色助手。当前模式为“前端工具调用 + 多轮二手筛选”。已执行工具清单：${JSON.stringify(results)}。回答规则：1) 只能基于工具返回数据作答，不得编造；2) 需要明确展示本轮最终筛选条件（关键词、价格区间、数量）；3) 只返回符合条件且真实存在的商品；4) 若无结果，明确说明并给出放宽筛选条件建议。`;
  }

  const intents = detectIntents(message, history);
  if (!intents.includes("secondhand")) return null;

  const criteria = resolveSecondhandCriteria(message, history);
  const result = await runSecondhandTool(criteria);
  const results: ToolRunResult[] = [result];

  return `你是“可自主规划并调用工具”的绿色助手。当前模式为“服务端工具调用 + 多轮二手筛选”。已执行工具清单：${JSON.stringify(results)}。回答规则：1) 只能基于工具返回数据作答，不得编造；2) 需要明确展示本轮最终筛选条件（关键词、价格区间、数量）；3) 只返回符合条件且真实存在的商品；4) 若无结果，明确说明并给出放宽筛选条件建议。`;
}

function parseFrontendToolContext(input: unknown): FrontendToolContext | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as {
    tool?: unknown;
    ok?: unknown;
    summary?: unknown;
    data?: unknown;
  };

  if (raw.tool !== "secondhand") return null;

  return {
    tool: "secondhand",
    ok: raw.ok === true,
    summary: typeof raw.summary === "string" ? raw.summary : "",
    data: raw.data && typeof raw.data === "object" ? (raw.data as FrontendToolContext["data"]) : undefined,
  };
}

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
  const frontendToolContext = parseFrontendToolContext(body?.toolContext);

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

  const dataSystemMessage = await buildDataSystemMessage(message, history, frontendToolContext);

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
        ...(dataSystemMessage
          ? [
              {
                role: "system" as const,
                content: dataSystemMessage,
              },
            ]
          : []),
        ...history,
        { role: "user", content: message },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    let msg = "DeepSeek 请求失败";

    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } };
      const upstreamMsg = parsed?.error?.message?.trim();
      if (upstreamMsg) {
        msg = upstreamMsg;
      }
    } catch {
      if (text.trim()) {
        msg = text.trim();
      }
    }

    if (/insufficient\s*balance/i.test(msg)) {
      msg = "DeepSeek 余额不足，请充值后重试或更换可用的 API Key。";
    }

    return NextResponse.json(
      {
        code: 1,
        msg,
      },
      { status: upstream.status || 500 }
    );
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
