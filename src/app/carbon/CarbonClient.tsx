"use client";

import * as echarts from "echarts";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useMemo, useRef, useState } from "react";

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

const TRANSPORT_FACTORS: Record<CommuteType, number> = {
  car: 0.22,
  ev: 0.08,
  public: 0.06,
  bike: 0.01,
};

const DIET_FACTORS: Record<DietType, number> = {
  meat: 2.6,
  balanced: 1.9,
  vegetarian: 1.3,
};

const HISTORY_KEY = "carbonHistory_v2";
const CHINA_GEOJSON_URL = "/api/maps/china";

const SUGGESTION_POOL = {
  transport: "🚴 通勤碳排偏高：每周至少 2 天改为骑行、步行或公共交通。",
  electricity: "💡 用电占比偏高：优先替换 LED 与一级能效家电，空调温度上调 1℃。",
  diet: "🥗 饮食碳排偏高：每周增加 2-3 餐植物性饮食，减少高碳红肉摄入。",
  water: "🚰 建议安装节水起泡器并缩短淋浴时长，降低隐含能耗与用水负担。",
  habit: "♻️ 尝试“少即是多”采购策略：优先耐用品与可重复使用物品。",
};

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
  const [history, setHistory] = useState<HistoryRecord[]>(readHistory);
  const [savedHint, setSavedHint] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [mapSeriesData, setMapSeriesData] = useState<Array<{ name: string; value: number }>>([]);
  const [mapRange, setMapRange] = useState<{ min: number; max: number }>({ min: 0, max: 1 });

  const transportEmission = useMemo(
    () => distance * TRANSPORT_FACTORS[commuteType],
    [distance, commuteType]
  );
  const electricityEmission = useMemo(() => (electricity / 30) * 0.57, [electricity]);
  const dietEmission = useMemo(() => DIET_FACTORS[dietType], [dietType]);

  const total = useMemo(
    () => transportEmission + electricityEmission + dietEmission,
    [transportEmission, electricityEmission, dietEmission]
  );

  const treeEquivalent = useMemo(() => ((total * 365) / 18).toFixed(1), [total]);

  const recommendation = useMemo(() => {
    const list: string[] = [];
    if (transportEmission >= 3.5) list.push(SUGGESTION_POOL.transport);
    if (electricityEmission >= 5) list.push(SUGGESTION_POOL.electricity);
    if (dietEmission >= 2.4) list.push(SUGGESTION_POOL.diet);

    if (list.length < 3) list.push(SUGGESTION_POOL.water);
    if (list.length < 4) list.push(SUGGESTION_POOL.habit);

    return list.slice(0, 4);
  }, [transportEmission, electricityEmission, dietEmission]);

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
    const donut = donutChartRef.current;
    if (!donut) return;

    donut.setOption({
      animationDuration: 700,
      animationEasing: "cubicOut",
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} kg CO₂e/日 ({d}%)",
      },
      color: ["#3A5E4C", "#D9B48B", "#A7C5A3"],
      series: [
        {
          type: "pie",
          radius: ["58%", "80%"],
          center: ["50%", "52%"],
          avoidLabelOverlap: true,
          labelLine: {
            length: 12,
            length2: 12,
            smooth: 0.2,
          },
          label: {
            color: "#6f6257",
            formatter: "{b}\n{d}%",
          },
          itemStyle: {
            borderColor: "#fcfaf6",
            borderWidth: 2,
            shadowBlur: 8,
            shadowColor: "rgba(76,63,49,0.12)",
          },
          data: [
            { value: Number(transportEmission.toFixed(2)), name: "交通" },
            { value: Number(electricityEmission.toFixed(2)), name: "用电" },
            { value: Number(dietEmission.toFixed(2)), name: "饮食" },
          ],
        },
      ],
      graphic: [
        {
          type: "text",
          left: "center",
          top: "43%",
          style: {
            text: `${total.toFixed(2)}`,
            fill: "#4f4137",
            fontSize: 26,
            fontWeight: 700,
            textAlign: "center",
          },
        },
        {
          type: "text",
          left: "center",
          top: "56%",
          style: {
            text: "kg CO₂e/日",
            fill: "#8c7c6f",
            fontSize: 12,
            textAlign: "center",
          },
        },
      ],
    });
  }, [transportEmission, electricityEmission, dietEmission, total]);

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
    const item = {
      date: new Date().toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      value: Number(total.toFixed(2)),
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
            onClick={save}
            className="rounded-full bg-[#5f7b57] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#516a4b]"
          >
            计算碳足迹
          </button>
          {savedHint && <p className="text-sm text-[#5f7b57]">{savedHint}</p>}
        </div>

        <div className="rounded-[24px] border border-[#e1d5c6] bg-[#fcfaf6] p-5 shadow-[0_16px_38px_-28px_rgba(76,63,49,0.5)]">
          <h2 className="text-lg font-semibold text-[#5f4a3f]">碳排构成（每日）</h2>
          <div className="mt-2 text-[#6f6257]">
            <p className="text-4xl font-bold tracking-tight text-[#4f4137]">{total.toFixed(2)} <span className="text-lg font-medium">kg CO₂e/日</span></p>
            <p className="mt-1 text-sm">约相当于 {treeEquivalent} 棵树一年的吸碳量。</p>
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
            {recommendation.map((item) => (
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
          {history.length === 0 ? (
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
    </section>
  );
}
