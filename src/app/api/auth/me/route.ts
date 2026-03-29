import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  return NextResponse.json({ code: 0, data: user });
}
