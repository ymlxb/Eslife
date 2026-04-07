import { badRequestResponse, forwardJsonRequest, serverConfigResponse, unauthorizedResponse, verifyServiceToken } from "@/lib/workflow-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SecondhandRequest = {
  keyword: string;
  category?: string;
  price_min?: number;
  price_max?: number;
  city?: string;
};

type SecondhandItem = {
  title: string;
  price: number;
  category: string;
  publish_time: string;
};

type SecondhandResponse = {
  items: SecondhandItem[];
};

export async function POST(request: Request) {
  if (!verifyServiceToken(request)) {
    return unauthorizedResponse();
  }

  const apiUrl = process.env.SECONDHAND_UPSTREAM_URL?.trim();
  const apiToken = process.env.SECONDHAND_UPSTREAM_TOKEN?.trim() || process.env.UPSTREAM_SERVICE_TOKEN?.trim();

  if (!apiUrl || !apiToken) {
    return serverConfigResponse("secondhand_upstream_not_configured");
  }

  const body = (await request.json().catch(() => null)) as Partial<SecondhandRequest> | null;
  const keyword = typeof body?.keyword === "string" ? body.keyword.trim() : "";

  if (!keyword) {
    return badRequestResponse("invalid_secondhand_payload");
  }

  const priceMin = body?.price_min === undefined ? undefined : Number(body.price_min);
  const priceMax = body?.price_max === undefined ? undefined : Number(body.price_max);

  if ((priceMin !== undefined && Number.isNaN(priceMin)) || (priceMax !== undefined && Number.isNaN(priceMax))) {
    return badRequestResponse("invalid_price_range");
  }

  const payload: SecondhandRequest = {
    keyword,
    category: typeof body?.category === "string" ? body.category.trim() : undefined,
    city: typeof body?.city === "string" ? body.city.trim() : undefined,
    price_min: priceMin,
    price_max: priceMax,
  };

  return forwardJsonRequest<SecondhandRequest, SecondhandResponse>({
    url: apiUrl,
    token: apiToken,
    payload,
  });
}
