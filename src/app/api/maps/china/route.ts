import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SOURCE_URL = "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json";

export async function GET() {
  try {
    const upstream = await fetch(SOURCE_URL, {
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!upstream.ok) {
      return NextResponse.json({ code: 1, msg: "地图数据源不可用" }, { status: 502 });
    }

    const geoJson = await upstream.json();
    return NextResponse.json(geoJson, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json({ code: 1, msg: "地图数据拉取失败" }, { status: 500 });
  }
}
