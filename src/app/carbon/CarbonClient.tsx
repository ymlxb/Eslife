"use client";

import { useMemo, useState } from "react";

type VehicleType = "car" | "ev" | "public";

type HistoryRecord = {
  date: string;
  value: string;
};

const FACTORS = {
  electricity: 0.5,
  gas: 1.9,
  car: 0.12,
  ev: 0.05,
  public: 0.08,
};

function readHistory(): HistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("carbonHistory") || "[]");
  } catch {
    return [];
  }
}

export default function CarbonClient() {
  const [electricity, setElectricity] = useState(0);
  const [gas, setGas] = useState(0);
  const [mileage, setMileage] = useState(0);
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [history, setHistory] = useState<HistoryRecord[]>(readHistory);

  const energyEmission = electricity * FACTORS.electricity + gas * FACTORS.gas;
  const transportFactor = vehicleType === "car" ? FACTORS.car : vehicleType === "ev" ? FACTORS.ev : FACTORS.public;
  const transportEmission = mileage * transportFactor;
  const total = useMemo(() => energyEmission + transportEmission, [energyEmission, transportEmission]);

  const recommendation = useMemo(() => {
    const list: string[] = [];
    if (electricity > 300) {
      list.push("当前用电较高：建议替换 LED 灯并使用一级能效电器。");
    }
    if (vehicleType === "car" && mileage > 500) {
      list.push("燃油车里程较高：建议每周至少 2 天采用公共交通/拼车。");
    }
    if (gas > 80) {
      list.push("燃气消耗偏高：可优化烹饪流程并检查设备热效率。");
    }
    return list;
  }, [electricity, gas, mileage, vehicleType]);

  const save = () => {
    const item = {
      date: new Date().toLocaleDateString("zh-CN"),
      value: total.toFixed(2),
    };
    const next = [item, ...history].slice(0, 5);
    setHistory(next);
    localStorage.setItem("carbonHistory", JSON.stringify(next));
  };

  const totalParts = Math.max(total, 1);
  const energyPercent = Math.round((energyEmission / totalParts) * 100);
  const transportPercent = 100 - energyPercent;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">数据输入</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">电力 (kWh/月)</span>
            <input type="number" min={0} value={electricity} onChange={(e) => setElectricity(Number(e.target.value || 0))} className="h-10 w-full rounded-lg border border-zinc-300 px-3" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">天然气 (m³/月)</span>
            <input type="number" min={0} value={gas} onChange={(e) => setGas(Number(e.target.value || 0))} className="h-10 w-full rounded-lg border border-zinc-300 px-3" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">里程 (km/月)</span>
            <input type="number" min={0} value={mileage} onChange={(e) => setMileage(Number(e.target.value || 0))} className="h-10 w-full rounded-lg border border-zinc-300 px-3" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-600">交通工具</span>
            <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleType)} className="h-10 w-full rounded-lg border border-zinc-300 px-3">
              <option value="car">汽油车</option>
              <option value="ev">电动车</option>
              <option value="public">公共交通</option>
            </select>
          </label>
        </div>

        <div className="rounded-xl bg-zinc-50 p-4 text-sm">
          <p>电力排放：{(electricity * FACTORS.electricity).toFixed(2)} kgCO₂</p>
          <p>燃气排放：{(gas * FACTORS.gas).toFixed(2)} kgCO₂</p>
          <p>交通排放：{transportEmission.toFixed(2)} kgCO₂</p>
          <p className="mt-2 text-base font-semibold">总排放：{total.toFixed(2)} kgCO₂ / 月</p>
        </div>

        <button onClick={save} className="rounded-lg bg-black px-4 py-2 text-white">
          保存记录
        </button>
      </div>

      <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">构成与建议</h2>

        <div className="space-y-2">
          <div className="text-sm text-zinc-600">能源占比 {energyPercent}%</div>
          <div className="h-3 overflow-hidden rounded bg-zinc-100">
            <div className="h-3 bg-blue-500" style={{ width: `${energyPercent}%` }} />
          </div>
          <div className="text-sm text-zinc-600">交通占比 {transportPercent}%</div>
          <div className="h-3 overflow-hidden rounded bg-zinc-100">
            <div className="h-3 bg-emerald-500" style={{ width: `${transportPercent}%` }} />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">优化建议</h3>
          {recommendation.length === 0 ? (
            <p className="text-sm text-zinc-500">当前表现良好，继续保持低碳习惯。</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
              {recommendation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">最近 5 次记录</h3>
          {history.length === 0 ? (
            <p className="text-sm text-zinc-500">暂无历史记录</p>
          ) : (
            <ul className="space-y-1 text-sm text-zinc-700">
              {history.map((item, idx) => (
                <li key={`${item.date}-${idx}`} className="flex justify-between rounded bg-zinc-50 px-3 py-2">
                  <span>#{idx + 1} {item.date}</span>
                  <span>{item.value} kgCO₂</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
