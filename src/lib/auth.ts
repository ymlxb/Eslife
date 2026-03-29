import { SignJWT, jwtVerify } from "jose";

const TOKEN_COOKIE = "next_app_token";

function getSecret() {
  const secret = process.env.AUTH_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  uid: number;
  username: string;
};

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as SessionPayload;
}

export const AUTH_COOKIE_NAME = TOKEN_COOKIE;
