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
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ code: 1, msg: "请上传头像图片" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ code: 1, msg: "仅支持 jpg/png/webp/jfif" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ code: 1, msg: "图片大小不能超过 2MB" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  const filename = `${Date.now()}-${randomUUID()}${extFromType(file.type)}`;
  const canUseBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  let url = "";
  if (canUseBlob) {
    const blob = await put(`uploads/avatars/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    url = blob.url;
  } else {
    await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fullPath = path.join(uploadDir, filename);
    await writeFile(fullPath, buffer);
    url = `/uploads/avatars/${filename}`;
  }

  return NextResponse.json({ code: 0, msg: "上传成功", data: { url } });
}
