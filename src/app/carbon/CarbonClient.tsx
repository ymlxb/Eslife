"use client";

import * as echarts from "echarts";
import { CanvasRenderer } from "echarts/renderers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

(echarts as unknown as { use?: (ext: unknown[]) => void }).use?.([CanvasRenderer]);

type CommuteType = "car" | "ev" | "public" | "bike";
type DietType = "meat" | "balanced" | "vegetarian";

type HistoryRecord = {
  date: string;
  value: number;
};

type GeoFeature = {
  properties?: {
    name?: string;
    adcode?: number;
  };
};

type ChinaGeoJson = {
  type: string;
  features?: GeoFeature[];
};

type CarbonAiResult = {
  summary: string;
  chartCode: string;
};

const HISTORY_KEY = "carbonHistory_v2";
const CHINA_GEOJSON_URL = "/api/maps/china";

function readHistory(): HistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function CarbonClient() {
  const donutRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const donutChartRef = useRef<echarts.ECharts | null>(null);
  const mapChartRef = useRef<echarts.ECharts | null>(null);

  const [commuteType, setCommuteType] = useState<CommuteType>("car");
  const [distance, setDistance] = useState(20);
  const [electricity, setElectricity] = useState(280);
  const [dietType, setDietType] = useState<DietType>("balanced");
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyHydrated, setHistoryHydrated] = useState(false);
  const [savedHint, setSavedHint] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [mapSeriesData, setMapSeriesData] = useState<Array<{ name: string; value: number }>>([]);
  const [mapRange, setMapRange] = useState<{ min: number; max: number }>({ min: 0, max: 1 });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState<CarbonAiResult | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownTitle, setDrilldownTitle] = useState("");
  const [drilldownText, setDrilldownText] = useState("");
  const [drilldownOpen, setDrilldownOpen] = useState(false);

  const parseOption = (code: string): echarts.EChartsOption | null => {
    if (!code) return null;

    const extractOptionLiteral = (input: string) => {
      const text = input.trim();

      const scriptMatches = [...text.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
      const source = scriptMatches.length > 0
        ? (scriptMatches[scriptMatches.length - 1][1] || text)
        : text;

      const assignMatch = source.match(/(?:var|let|const)?\s*option\s*=\s*/i);
      if (!assignMatch || assignMatch.index === undefined) {
        return source.replace(/^\s*option\s*=\s*/i, "").replace(/;\s*$/, "").trim();
      }

      const startSearch = assignMatch.index + assignMatch[0].length;
      const braceStart = source.indexOf("{", startSearch);
      if (braceStart < 0) return "";

      let depth = 0;
      let inSingle = false;
      let inDouble = false;
      let escaped = false;

      for (let i = braceStart; i < source.length; i += 1) {
        const ch = source[i];

        if (escaped) {
          escaped = false;
          continue;
        }

        if (ch === "\\") {
          escaped = true;
          continue;
        }

        if (!inDouble && ch === "'") {
          inSingle = !inSingle;
          continue;
        }

        if (!inSingle && ch === '"') {
          inDouble = !inDouble;
          continue;
        }

        if (inSingle || inDouble) continue;

        if (ch === "{") depth += 1;
        if (ch === "}") {
          depth -= 1;
          if (depth === 0) {
            return source.slice(braceStart, i + 1).trim();
          }
        }
      }

      return "";
    };

    const optionText = extractOptionLiteral(code);
    if (!optionText) return null;

    try {
      return JSON.parse(optionText) as echarts.EChartsOption;
    } catch {
      try {
        if (!optionText.startsWith("{")) return null;
        const parsed = Function(`"use strict"; return (${optionText});`)() as unknown;
        if (!parsed || typeof parsed !== "object") return null;
        return parsed as echarts.EChartsOption;
      } catch {
        return null;
      }
    }
  };

  const aiChartOption = useMemo(() => parseOption(aiResult?.chartCode || ""), [aiResult]);

  const normalizedAiChartOption = useMemo(() => {
    if (!aiChartOption) return null;

    const source = aiChartOption as echarts.EChartsOption & {
      legend?: { selectedMode?: boolean | "single" | "multiple"; selected?: Record<string, boolean> } | Array<{ selectedMode?: boolean | "single" | "multiple"; selected?: Record<string, boolean> }>;
      series?: Array<{ type?: string; data?: Array<{ name?: string; value?: number | string }>; selectedMode?: boolean | "single" | "multiple" }>;
    };

    const next: echarts.EChartsOption & {
      legend?: { selectedMode?: boolean | "single" | "multiple"; selected?: Record<string, boolean> } | Array<{ selectedMode?: boolean | "single" | "multiple"; selected?: Record<string, boolean> }>;
      series?: Array<{ type?: string; data?: Array<{ name?: string; value?: number | string }>; selectedMode?: boolean | "single" | "multiple" }>;
    } = {
      ...source,
      legend: source.legend,
      series: source.series,
    };

    const pieSeries = Array.isArray(next.series)
      ? next.series.filter((item) => item?.type === "pie")
      : [];

    const allNames = pieSeries.flatMap((series) =>
      Array.isArray(series.data)
        ? series.data
            .map((d) => (typeof d?.name === "string" ? d.name.trim() : ""))
            .filter(Boolean)
        : [],
    );

    if (Array.isArray(next.legend)) {
      next.legend = next.legend.map((legend) => ({
        ...legend,
        selectedMode: false,
        selected: Object.fromEntries(allNames.map((name) => [name, true])),
      }));
    } else if (next.legend) {
      next.legend = {
        ...next.legend,
        selectedMode: false,
        selected: Object.fromEntries(allNames.map((name) => [name, true])),
      };
    }

    if (Array.isArray(next.series)) {
      next.series = next.series.map((series) => {
        if (series?.type !== "pie") return series;
        return {
          ...series,
          selectedMode: false,
          data: Array.isArray(series.data)
            ? series.data.map((item) => ({
                ...item,
                value: Number(item?.value ?? 0),
              }))
            : series.data,
        };
      });
    }

    return next;
  }, [aiChartOption]);

  const aiTotal = useMemo(() => {
    if (!normalizedAiChartOption || !Array.isArray(normalizedAiChartOption.series)) return 0;
    const firstPie = normalizedAiChartOption.series.find((item) => {
      const typed = item as { type?: unknown };
      return typed.type === "pie";
    }) as { data?: Array<{ value?: number | string }> } | undefined;

    if (!firstPie?.data) return 0;
    return firstPie.data.reduce((sum, item) => {
      const value = Number(item?.value ?? 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [normalizedAiChartOption]);

  const recommendation = useMemo(() => {
    const summary = aiResult?.summary || "";
    const lines = summary
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => /^\d+[.、]|^[-*]/.test(item) || item.includes("建议"));
    return lines.slice(0, 5);
  }, [aiResult]);

  useEffect(() => {
    setHistory(readHistory());
    setHistoryHydrated(true);
  }, []);

  useEffect(() => {
    if (!donutRef.current || !mapRef.current) return;

    const donut = echarts.init(donutRef.current);
    const map = echarts.init(mapRef.current);

    donutChartRef.current = donut;
    mapChartRef.current = map;

    const onResize = () => {
      donut.resize();
      map.resize();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      donut.dispose();
      map.dispose();
      donutChartRef.current = null;
      mapChartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!donutRef.current) return;
    if (!donutChartRef.current) {
      donutChartRef.current = echarts.init(donutRef.current);
    }

    const chart = donutChartRef.current;
    if (!chart) return;

    chart.off("click");

    if (!normalizedAiChartOption) {
      chart.clear();
      chart.setOption({
        title: {
          text: "等待 AI 计算结果",
          left: "center",
          top: "middle",
          textStyle: {
            color: "#8c7c6f",
            fontSize: 16,
            fontWeight: 500,
          },
        },
      });
      return;
    }

    chart.setOption(normalizedAiChartOption, true);
    chart.resize();
  }, [normalizedAiChartOption]);

  useEffect(() => {
    let cancelled = false;

    const loadChinaGeo = async () => {
      try {
        const res = await fetch(CHINA_GEOJSON_URL);
        if (!res.ok) throw new Error("加载地图数据失败");
        const geoJson = (await res.json()) as ChinaGeoJson;

        const nextData = (geoJson.features || [])
          .map((f) => ({
            name: f.properties?.name || "",
            value: Number(f.properties?.adcode),
          }))
          .filter((item) => item.name && Number.isFinite(item.value));

        const values = nextData.map((item) => item.value);
        const min = values.length ? Math.min(...values) : 0;
        const max = values.length ? Math.max(...values) : 1;

        if (!cancelled) {
          setMapSeriesData(nextData);
          setMapRange({ min, max: min === max ? min + 1 : max });
        }

        echarts.registerMap("china", geoJson as unknown as Parameters<typeof echarts.registerMap>[1]);
        if (!cancelled) {
          setMapReady(true);
          setMapUnavailable(false);
        }
      } catch {
        if (!cancelled) {
          setMapUnavailable(true);
          setMapReady(false);
        }
      }
    };

    void loadChinaGeo();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapChartRef.current;
    if (!map || !mapReady) return;

    map.setOption({
      animationDuration: 900,
      animationEasing: "quarticOut",
      tooltip: {
        trigger: "item",
        formatter: (params: { name?: string; value?: number }) => {
          const value = typeof params.value === "number" ? params.value.toFixed(2) : "--";
          return `${params.name || "未知"}<br/>电网碳强度：${value} kg CO₂e/kWh`;
        },
      },
      visualMap: {
        min: mapRange.min,
        max: mapRange.max,
        left: 20,
        bottom: 10,
        calculable: true,
        orient: "horizontal",
        text: ["高", "低"],
        inRange: {
          color: ["#7ea381", "#d5c36d", "#d89a5d"],
        },
        textStyle: {
          color: "#6f6257",
        },
      },
      series: [
        {
          name: "省级电网碳强度",
          type: "map",
          map: "china",
          roam: false,
          data: mapSeriesData,
          emphasis: {
            label: { color: "#4f4137" },
            itemStyle: {
              areaColor: "#efc17e",
              borderColor: "#83654f",
            },
          },
          itemStyle: {
            areaColor: "#e5eddc",
            borderColor: "#d1c2b1",
          },
        },
      ],
    });
  }, [mapReady, mapRange, mapSeriesData]);

  const save = () => {
    if (!aiTotal) {
      setSavedHint("请先点击“AI 工作流分析”获取结果");
      window.setTimeout(() => setSavedHint(""), 1200);
      return;
    }

    const item = {
      date: new Date().toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      value: Number(aiTotal.toFixed(2)),
    };
    const next = [item, ...history].slice(0, 5);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setSavedHint("已保存到历史记录");
    window.setTimeout(() => setSavedHint(""), 1200);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.setItem(HISTORY_KEY, "[]");
  };

  const runAiWorkflow = useCallback(async (focusSector?: string) => {
    setAiLoading(true);
    setAiError("");
    if (!focusSector) {
      setAiResult(null);
      setDrilldownText("");
      setDrilldownTitle("");
      setDrilldownOpen(false);
    }

    try {
      const res = await fetch("/api/carbon/workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          diet: dietType === "meat" ? "high" : "normal",
          electricity,
          transport: commuteType === "public" || commuteType === "bike" ? "public" : "car",
          commute_distance: distance,
          analysis_mode: focusSector ? "drilldown" : "base",
          focus_sector: focusSector,
          context_summary: aiResult?.summary || "",
        }),
      });

      const json = (await res.json().catch(() => null)) as {
        code?: number;
        msg?: string;
        data?: CarbonAiResult;
      } | null;

      if (!res.ok || json?.code !== 0 || !json?.data) {
        throw new Error(json?.msg || "AI 工作流调用失败");
      }

      if (focusSector) {
        setDrilldownTitle(`${focusSector} 深度减碳方案`);
        setDrilldownText(json.data.summary || "暂无深度分析内容");
        setDrilldownOpen(true);
      } else {
        setAiResult(json.data);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "AI 工作流调用失败";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  }, [aiResult?.summary, commuteType, dietType, distance, electricity]);

  useEffect(() => {
    const chart = donutChartRef.current;
    if (!chart || !normalizedAiChartOption) return;

    const handler = (params: { name?: string }) => {
      const focus = typeof params?.name === "string" ? params.name.trim() : "";
      if (!focus) return;
      setDrilldownLoading(true);
      void runAiWorkflow(focus).finally(() => setDrilldownLoading(false));
    };

    chart.on("click", handler);
    return () => {
      chart.off("click", handler);
    };
  }, [normalizedAiChartOption, runAiWorkflow]);

  const backToBaseAnalysis = async () => {
    setDrilldownOpen(false);
    setDrilldownLoading(true);
    try {
      await runAiWorkflow();
    } finally {
      setDrilldownLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        <div className="space-y-4 rounded-[24px] border border-[#e1d5c6] bg-[#fcfaf6] p-5 shadow-[0_16px_38px_-28px_rgba(76,63,49,0.5)]">
          <h2 className="text-lg font-semibold text-[#5f4a3f]">输入参数</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm leading-[1.4]">
              <span className="mb-1 block text-[#7d6f63]">交通方式</span>
              <select value={commuteType} onChange={(e) => setCommuteType(e.target.value as CommuteType)} className="h-11 w-full rounded-xl border border-[#d9cab7] bg-white px-3 text-[#4f4137]">
                <option value="car">燃油车</option>
                <option value="ev">电动车</option>
                <option value="public">公共交通</option>
                <option value="bike">步行/骑行</option>
              </select>
            </label>
            <label className="text-sm leading-[1.4]">
              <span className="mb-1 block text-[#7d6f63]">通勤距离 (km/日)</span>
              <input type="number" min={0} value={distance} onChange={(e) => setDistance(Number(e.target.value || 0))} className="h-11 w-full rounded-xl border border-[#d9cab7] bg-white px-3 text-[#4f4137]" />
            </label>
            <label className="text-sm leading-[1.4]">
              <span className="mb-1 block text-[#7d6f63]">月用电量 (kWh)</span>
              <input type="number" min={0} value={electricity} onChange={(e) => setElectricity(Number(e.target.value || 0))} className="h-11 w-full rounded-xl border border-[#d9cab7] bg-white px-3 text-[#4f4137]" />
            </label>
            <label className="text-sm leading-[1.4]">
              <span className="mb-1 block text-[#7d6f63]">饮食模式</span>
              <select value={dietType} onChange={(e) => setDietType(e.target.value as DietType)} className="h-11 w-full rounded-xl border border-[#d9cab7] bg-white px-3 text-[#4f4137]">
                <option value="meat">肉食为主</option>
                <option value="balanced">均衡饮食</option>
                <option value="vegetarian">植物性为主</option>
              </select>
            </label>
          </div>

          <button
            onClick={() => void runAiWorkflow()}
            disabled={aiLoading}
            className="rounded-full bg-[#3a5e4c] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#2f4d3f] disabled:opacity-60"
          >
            {aiLoading ? "AI 分析中..." : "AI 工作流分析"}
          </button>
          <button
            onClick={save}
            className="ml-3 rounded-full bg-[#5f7b57] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#516a4b]"
          >
            保存本次 AI 结果
          </button>
          {savedHint && <p className="text-sm text-[#5f7b57]">{savedHint}</p>}
          {aiError && <p className="text-sm text-[#b75f4b]">{aiError}</p>}
        </div>

        <div className="rounded-[24px] border border-[#e1d5c6] bg-[#fcfaf6] p-5 shadow-[0_16px_38px_-28px_rgba(76,63,49,0.5)]">
          <h2 className="text-lg font-semibold text-[#5f4a3f]">碳排构成（每日）</h2>
          <div className="mt-2 text-[#6f6257]">
            <p className="text-4xl font-bold tracking-tight text-[#4f4137]">{aiTotal.toFixed(2)} <span className="text-lg font-medium">kg CO₂e/日</span></p>
            <p className="mt-1 text-sm">该结果由 Coze 工作流计算。点击图表扇区可触发分项深度分析。</p>
          </div>
          <div ref={donutRef} className="mt-2 h-[310px] w-full" />
        </div>
      </div>

      <div className="rounded-[24px] border border-[#e1d5c6] bg-[#fcfaf6] p-5 shadow-[0_16px_38px_-28px_rgba(76,63,49,0.5)]">
        <h2 className="text-lg font-semibold text-[#5f4a3f]">中国各省电网碳强度（模拟）</h2>
        <p className="mt-1 text-sm text-[#7d6f63]">绿色到橙色表示由低碳到高碳，悬浮可查看具体数值。</p>
        <div className="relative mt-3">
          <div ref={mapRef} className="h-[460px] w-full rounded-2xl bg-[#f7f1e7]" />
          {mapUnavailable && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#f7f1e7]/90 text-sm text-[#8b7d71]">
              地图数据加载失败，请检查网络后刷新重试。
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] border border-[#e1d5c6] bg-[#f8f5f0] p-5 shadow-[0_14px_30px_-24px_rgba(76,63,49,0.45)]">
          <h3 className="mb-2 text-base font-semibold text-[#5f4a3f]">低碳生活建议</h3>
          <ul className="space-y-2 text-sm leading-[1.4] text-[#5d5147]">
            {recommendation.length === 0 ? (
              <li className="rounded-xl bg-white/75 px-3 py-2">请先点击“AI 工作流分析”获取建议。</li>
            ) : recommendation.map((item) => (
              <li key={item} className="rounded-xl bg-white/75 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[20px] border border-[#e1d5c6] bg-[#f8f5f0] p-5 shadow-[0_14px_30px_-24px_rgba(76,63,49,0.45)]">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#5f4a3f]">最近 5 次记录</h3>
            <button onClick={clearHistory} className="rounded-lg border border-[#d1c1ab] bg-white px-2.5 py-1 text-xs text-[#6f6257] hover:bg-[#f6ede2]">
              清空记录
            </button>
          </div>
          {!historyHydrated || history.length === 0 ? (
            <p className="text-sm text-[#84766b]">暂无历史记录</p>
          ) : (
            <ul className="space-y-1.5 text-sm text-[#5d5147]">
              {history.map((item, idx) => (
                <li key={`${item.date}-${idx}`} className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2">
                  <span>#{idx + 1} {item.date}</span>
                  <span className="flex items-center gap-2">
                    {item.value.toFixed(2)} kgCO₂e
                    {idx < history.length - 1 ? (
                      item.value > history[idx + 1].value ? (
                        <span className="text-[#b96f59]">↑</span>
                      ) : item.value < history[idx + 1].value ? (
                        <span className="text-[#5f7b57]">↓</span>
                      ) : (
                        <span className="text-[#8a7a6c]">→</span>
                      )
                    ) : (
                      <span className="text-[#8a7a6c]">·</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* {aiResult && (
        <div className="space-y-4 rounded-[20px] border border-[#e1d5c6] bg-[#f8f5f0] p-5 shadow-[0_14px_30px_-24px_rgba(76,63,49,0.45)]">
          <h3 className="text-base font-semibold text-[#5f4a3f]">Coze AI 工作流结果</h3>
          <div className="whitespace-pre-wrap rounded-xl bg-white/80 px-3 py-2 text-sm text-[#5d5147]">
            {aiResult.summary || "暂无总结内容"}
          </div>
          {drilldownLoading && <p className="text-sm text-[#6b7c62]">正在生成分项深度分析...</p>}
          <p className="text-xs text-[#7d6f63]">提示：点击上方饼图分项（交通/用电/饮食）可打开深度分析抽屉。</p>
        </div>
      )} */}

      {drilldownOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="关闭深度分析"
            className="absolute inset-0 bg-black/25"
            onClick={() => setDrilldownOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[440px] border-l border-[#d8cab7] bg-[#fcfaf6] p-5 shadow-[-12px_0_30px_-20px_rgba(76,63,49,0.45)]">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-semibold text-[#5f4a3f]">{drilldownTitle || "分项深度分析"}</h4>
              <button
                type="button"
                onClick={() => setDrilldownOpen(false)}
                className="rounded-lg border border-[#d1c1ab] bg-white px-2.5 py-1 text-xs text-[#6f6257] hover:bg-[#f6ede2]"
              >
                关闭
              </button>
            </div>

            <div className="rounded-xl bg-white px-3 py-3 text-sm leading-6 text-[#5d5147]">
              <div className="whitespace-pre-wrap">{drilldownText || "暂无深度分析内容"}</div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void backToBaseAnalysis()}
                disabled={aiLoading || drilldownLoading}
                className="rounded-full bg-[#3a5e4c] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2f4d3f] disabled:opacity-60"
              >
                {aiLoading || drilldownLoading ? "处理中..." : "返回基础分析"}
              </button>
              <button
                type="button"
                onClick={() => setDrilldownOpen(false)}
                className="rounded-full border border-[#d1c1ab] bg-white px-4 py-2 text-sm text-[#6f6257] hover:bg-[#f6ede2]"
              >
                保持当前结果
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
