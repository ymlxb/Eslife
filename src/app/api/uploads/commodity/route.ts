import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { getCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/jfif"]);

function extFromType(type: string) {
  if (type.includes("png")) return ".png";
  if (type.includes("webp")) return ".webp";
  return ".jpg";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: 1, msg: "未登录" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ code: 1, msg: "请上传图片" }, { status: 400 });
  }

  if (files.length > 5) {
    return NextResponse.json({ code: 1, msg: "最多上传 5 张图片" }, { status: 400 });
  }

  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ code: 1, msg: "仅支持 jpg/png/webp/jfif" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ code: 1, msg: "单张图片不能超过 2MB" }, { status: 400 });
    }
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "commodities");
  const canUseBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  if (!canUseBlob) {
    await mkdir(uploadDir, { recursive: true });
  }

  const urls: string[] = [];

  for (const file of files) {
    const filename = `${Date.now()}-${randomUUID()}${extFromType(file.type)}`;

    if (canUseBlob) {
      const blob = await put(`uploads/commodities/${filename}`, file, {
        access: "public",
        addRandomSuffix: false,
      });
      urls.push(blob.url);
      continue;
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fullPath = path.join(uploadDir, filename);
    await writeFile(fullPath, buffer);
    urls.push(`/uploads/commodities/${filename}`);
  }

  return NextResponse.json({ code: 0, msg: "上传成功", data: { urls } });
}
