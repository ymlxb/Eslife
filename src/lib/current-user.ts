import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifySession(token);
    if (!payload.uid) {
      return null;
    }

    return await prisma.user.findUnique({
      where: { id: payload.uid },
      select: {
        id: true,
        username: true,
        displayName: true,
        nickname: true,
        gender: true,
        mobile: true,
        email: true,
        avatar: true,
        address: true,
      },
    });
  } catch {
    return null;
  }
}
