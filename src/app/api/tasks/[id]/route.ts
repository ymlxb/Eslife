import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const body = await request.json();
  const data: { title?: string; completed?: boolean } = {};

  if (typeof body?.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }

  if (typeof body?.completed === "boolean") {
    data.completed = body.completed;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  const task = await prisma.task.update({
    where: { id },
    data,
  });

  return NextResponse.json(task);
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
