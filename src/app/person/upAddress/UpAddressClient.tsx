"use client";

import { useEffect, useState } from "react";

type Address = {
  id: number;
  addressee: string;
  mobile: string;
  province: string;
  city: string;
  fullAddress: string;
};

const provinces = ["北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江", "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "广西", "海南", "重庆", "四川", "贵州", "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆", "香港", "澳门", "台湾"];

export default function UpAddressClient() {
  const [list, setList] = useState<Address[]>([]);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ addressee: "", mobile: "", province: "", city: "", fullAddress: "" });

  const load = async () => {
    const res = await fetch("/api/addresses", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.code === 0) setList(data.data || []);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok || data.code !== 0) {
      setError(data.msg || "添加失败");
      return;
    }
    setShow(false);
    setForm({ addressee: "", mobile: "", province: "", city: "", fullAddress: "" });
    load();
  };

  const remove = async (id: number) => {
    const ok = window.confirm("确定删除该地址吗？");
    if (!ok) return;
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || data.code !== 0) {
      setError(data.msg || "删除失败");
      return;
    }
    load();
  };

  return (
    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">地址列表</h2>
        <button onClick={() => setShow(true)} className="rounded-lg bg-black px-4 py-2 text-white">新增地址</button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((item) => (
          <article key={item.id} className="rounded-xl border border-zinc-200 p-4">
            <p className="text-sm"><span className="text-zinc-500">收件人：</span>{item.addressee}</p>
            <p className="mt-1 text-sm"><span className="text-zinc-500">电话：</span>{item.mobile}</p>
            <p className="mt-1 text-sm"><span className="text-zinc-500">地区：</span>{item.province} {item.city}</p>
            <p className="mt-1 text-sm"><span className="text-zinc-500">地址：</span>{item.fullAddress}</p>
            <button onClick={() => remove(item.id)} className="mt-3 text-sm text-red-600 hover:underline">删除</button>
          </article>
        ))}
        {list.length === 0 && <p className="text-sm text-zinc-500">暂无地址</p>}
      </div>

      {show && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <form onSubmit={submit} className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-5">
            <h3 className="text-lg font-semibold">新增收货地址</h3>
            <input required value={form.addressee} onChange={(e) => setForm({ ...form, addressee: e.target.value })} placeholder="收件人" className="h-10 w-full rounded-lg border border-zinc-300 px-3" />
            <input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="联系电话" className="h-10 w-full rounded-lg border border-zinc-300 px-3" />
            <select required value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="h-10 w-full rounded-lg border border-zinc-300 px-3">
              <option value="">请选择省份</option>
              {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="城市" className="h-10 w-full rounded-lg border border-zinc-300 px-3" />
            <textarea required value={form.fullAddress} onChange={(e) => setForm({ ...form, fullAddress: e.target.value })} placeholder="详细地址" rows={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShow(false)} className="rounded-lg border border-zinc-300 px-4 py-2">取消</button>
              <button className="rounded-lg bg-black px-4 py-2 text-white">保存</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
