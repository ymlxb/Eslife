import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = typeof body?.title === "string" ? body.title.trim() : "";

  if (!title) {
    return NextResponse.json(
      { error: "title_required" },
      { status: 400 }
    );
  }

  const task = await prisma.task.create({
    data: { title },
  });

  return NextResponse.json(task, { status: 201 });
}
