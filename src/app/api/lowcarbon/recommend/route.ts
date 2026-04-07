import { badRequestResponse, forwardJsonRequest, serverConfigResponse, unauthorizedResponse, verifyServiceToken } from "@/lib/workflow-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RecommendRequest = {
  scene: string;
  user_level: string;
  count?: number;
};

type RecommendResponse = {
  tips: string[];
  policy: string;
};

export async function POST(request: Request) {
  if (!verifyServiceToken(request)) {
    return unauthorizedResponse();
  }

  const apiUrl = process.env.LOWCARBON_UPSTREAM_URL?.trim();
  const apiToken = process.env.LOWCARBON_UPSTREAM_TOKEN?.trim() || process.env.UPSTREAM_SERVICE_TOKEN?.trim();

  if (!apiUrl || !apiToken) {
    return serverConfigResponse("lowcarbon_upstream_not_configured");
  }

  const body = (await request.json().catch(() => null)) as Partial<RecommendRequest> | null;

  const scene = typeof body?.scene === "string" ? body.scene.trim() : "";
  const userLevel = typeof body?.user_level === "string" ? body.user_level.trim() : "";
  const count = body?.count === undefined ? undefined : Number(body.count);

  if (!scene || !userLevel || (count !== undefined && Number.isNaN(count))) {
    return badRequestResponse("invalid_recommend_payload");
  }

  const payload: RecommendRequest = {
    scene,
    user_level: userLevel,
    count,
  };

  return forwardJsonRequest<RecommendRequest, RecommendResponse>({
    url: apiUrl,
    token: apiToken,
    payload,
  });
}
