import { forwardJsonRequest, badRequestResponse, serverConfigResponse, unauthorizedResponse, verifyServiceToken } from "@/lib/workflow-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CarbonActivities = {
  transport: string;
  diet: string;
  electricity: number;
  frequency: string;
};

type CarbonRequest = {
  user_id: string;
  activities: CarbonActivities;
};

type CarbonResponse = {
  total_carbon_kg: number;
  level: string;
  suggestions: string[];
  compare: string;
};

export async function POST(request: Request) {
  if (!verifyServiceToken(request)) {
    return unauthorizedResponse();
  }

  const apiUrl = process.env.CARBON_UPSTREAM_URL?.trim();
  const apiToken = process.env.CARBON_UPSTREAM_TOKEN?.trim() || process.env.UPSTREAM_SERVICE_TOKEN?.trim();

  if (!apiUrl || !apiToken) {
    return serverConfigResponse("carbon_upstream_not_configured");
  }

  const body = (await request.json().catch(() => null)) as Partial<CarbonRequest> | null;

  const userId = typeof body?.user_id === "string" ? body.user_id.trim() : "";
  const activities = body?.activities;

  if (!userId || !activities || typeof activities !== "object") {
    return badRequestResponse("invalid_carbon_payload");
  }

  const payload: CarbonRequest = {
    user_id: userId,
    activities: {
      transport: typeof activities.transport === "string" ? activities.transport.trim() : "",
      diet: typeof activities.diet === "string" ? activities.diet.trim() : "",
      electricity: Number(activities.electricity),
      frequency: typeof activities.frequency === "string" ? activities.frequency.trim() : "",
    },
  };

  if (!payload.activities.transport || !payload.activities.diet || !payload.activities.frequency || Number.isNaN(payload.activities.electricity)) {
    return badRequestResponse("invalid_carbon_activities");
  }

  return forwardJsonRequest<CarbonRequest, CarbonResponse>({
    url: apiUrl,
    token: apiToken,
    payload,
  });
}
