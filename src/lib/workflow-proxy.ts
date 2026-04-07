import { NextResponse } from "next/server";

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data?: T;
};

export function unauthorizedResponse() {
  return NextResponse.json({ code: 1, message: "unauthorized" }, { status: 401 });
}

export function badRequestResponse(message: string) {
  return NextResponse.json({ code: 1, message }, { status: 400 });
}

export function serverConfigResponse(message: string) {
  return NextResponse.json({ code: 1, message }, { status: 500 });
}

export function verifyServiceToken(request: Request): boolean {
  const expected = process.env.WORKFLOW_SERVICE_TOKEN?.trim();
  if (!expected) return false;

  const auth = request.headers.get("authorization") ?? "";
  const [scheme, token] = auth.split(" ");

  return scheme?.toLowerCase() === "bearer" && token?.trim() === expected;
}

export async function forwardJsonRequest<TPayload extends object, TResult>(params: {
  url: string;
  token: string;
  payload: TPayload;
}) {
  const upstream = await fetch(params.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params.payload),
    cache: "no-store",
  });

  const rawText = await upstream.text().catch(() => "");
  let parsed: ApiEnvelope<TResult> | null = null;

  if (rawText) {
    try {
      parsed = JSON.parse(rawText) as ApiEnvelope<TResult>;
    } catch {
      parsed = null;
    }
  }

  if (!upstream.ok) {
    const msg = parsed?.message?.trim() || rawText.trim() || "upstream_request_failed";
    return NextResponse.json(
      {
        code: 1,
        message: msg,
      },
      { status: upstream.status || 502 }
    );
  }

  if (!parsed) {
    return NextResponse.json(
      {
        code: 1,
        message: "upstream_invalid_json",
      },
      { status: 502 }
    );
  }

  return NextResponse.json(parsed, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
