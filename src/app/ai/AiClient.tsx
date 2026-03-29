"use client";

import { useMemo, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string; time: string };

function replyByRule(q: string): string {
  const text = q.toLowerCase();
  if (text.includes("垃圾") || text.includes("分类")) {
    return "垃圾分类建议：可回收物（纸、塑料、金属、玻璃）单独投放；厨余垃圾沥干后投放；有害垃圾如电池、灯管单独回收；其余归为其他垃圾。";
  }
  if (text.includes("节能") || text.includes("省电")) {
    return "节能建议：优先一级能效家电、空调夏季建议 26°C、待机设备集中断电、照明改用 LED，并尽量利用自然光。";
  }
  if (text.includes("出行") || text.includes("碳") || text.includes("公交")) {
    return "绿色出行建议：短途步行/骑行，中长途优先公共交通；固定通勤可拼车；如需自驾，保持匀速和合理胎压可降低油耗。";
  }
  if (text.includes("用水") || text.includes("节水")) {
    return "节水建议：安装节水龙头、缩短淋浴时长、及时修复漏水点，并将清洗废水用于冲厕或浇花。";
  }
  return "我可以回答垃圾分类、节能减排、绿色出行、低碳生活等问题。你可以更具体一点，例如“我家每月用电 400 度怎么降碳？”";
}

export default function AiClient() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "你好！我是你的 AI 环保助手，欢迎咨询垃圾分类、节能减排和低碳生活问题。",
      time: new Date().toLocaleTimeString("zh-CN"),
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    const now = new Date().toLocaleTimeString("zh-CN");
    const answer = replyByRule(q);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: q, time: now },
      { role: "assistant", content: answer, time: new Date().toLocaleTimeString("zh-CN") },
    ]);
    setInput("");
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="h-[60vh] space-y-3 overflow-y-auto rounded-xl bg-zinc-50 p-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-zinc-900 text-white" : "bg-white text-zinc-800 border border-zinc-200"}`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              <p className={`mt-1 text-[11px] ${m.role === "user" ? "text-zinc-300" : "text-zinc-500"}`}>{m.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="输入你的环保问题..."
          className="h-10 flex-1 rounded-lg border border-zinc-300 px-3"
        />
        <button disabled={!canSend} onClick={send} className="h-10 rounded-lg bg-black px-4 text-white disabled:opacity-50">
          发送
        </button>
      </div>
    </section>
  );
}
