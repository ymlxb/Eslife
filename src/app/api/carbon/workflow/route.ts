import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CarbonWorkflowPayload = {
  diet: string;
  electricity: number;
  transport: string;
  commute_distance?: number;
  analysis_mode?: string;
  focus_sector?: string;
  context_summary?: string;
};

type CozeMessageChunk = {
  content?: unknown;
};

function extractMessageTextFromSse(rawSse: string) {
  const lines = rawSse.split(/\r?\n/);
  const chunks: string[] = [];
  let currentEvent = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("event:")) {
      currentEvent = line.slice(6).trim();
      continue;
    }

    if (!line.startsWith("data:")) continue;

    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;

    try {
      const parsed = JSON.parse(payload) as CozeMessageChunk;
      const content = typeof parsed.content === "string" ? parsed.content : "";
      if (!content) continue;
      if (currentEvent && currentEvent !== "Message") continue;
      chunks.push(content);
    } catch {
      // ignore non-JSON payload
    }
  }

  return chunks.join("");
}

function extractSummaryAndChart(text: string) {
  const match = text.match(/```echarts\s*([\s\S]*?)```/i);
  const chartCode = match?.[1]?.trim() || "";
  const summary = text.split(/```echarts/i)[0]?.trim() || text.trim();
  return { summary, chartCode };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const token = process.env.COZE_API_TOKEN?.trim();
  const workflowId = process.env.COZE_WORKFLOW_ID?.trim();
  const baseURL = process.env.COZE_BASE_URL?.trim() || "https://api.coze.cn";

  if (!token || !workflowId) {
    return NextResponse.json(
      {
        code: 1,
        msg: "服务端未配置 COZE_API_TOKEN 或 COZE_WORKFLOW_ID",
      },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as Partial<CarbonWorkflowPayload> | null;
  const diet = typeof body?.diet === "string" ? body.diet.trim() : "";
  const transport = typeof body?.transport === "string" ? body.transport.trim() : "";
  const electricity = Number(body?.electricity);
  const commuteDistance = Number(body?.commute_distance);
  const analysisMode = typeof body?.analysis_mode === "string" ? body.analysis_mode.trim() : "base";
  const focusSector = typeof body?.focus_sector === "string" ? body.focus_sector.trim() : "";
  const contextSummary = typeof body?.context_summary === "string" ? body.context_summary.trim() : "";

  if (!diet || !transport || Number.isNaN(electricity)) {
    return NextResponse.json({ code: 1, msg: "参数不合法" }, { status: 400 });
  }

  const upstream = await fetch(`${baseURL}/v1/workflow/stream_run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workflow_id: workflowId,
      parameters: {
        diet,
        electricity,
        transport,
        commute_distance: Number.isNaN(commuteDistance) ? undefined : commuteDistance,
        analysis_mode: analysisMode || "base",
        focus_sector: focusSector || undefined,
        context_summary: contextSummary || undefined,
      },
    }),
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        code: 1,
        msg: text.trim() || "Coze 工作流调用失败",
      },
      { status: upstream.status || 500 }
    );
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
  }

  const messageText = extractMessageTextFromSse(fullText);
  const normalizedText = messageText || fullText;
  const { summary, chartCode } = extractSummaryAndChart(normalizedText);

  return NextResponse.json({
    code: 0,
    data: {
      summary,
      chartCode,
      raw: normalizedText,
    },
  });
}
