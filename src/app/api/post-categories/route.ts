import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.postCategory.findMany({
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ code: 0, data: categories });
}
