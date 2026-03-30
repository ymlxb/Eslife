import axios, { type AxiosRequestConfig } from "axios";

export type ApiResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T;
};

const http = axios.create({
  withCredentials: true,
  timeout: 12000,
  validateStatus: () => true,
});

const inflightGetMap = new Map<string, Promise<ApiResult<unknown>>>();

function buildCacheKey(config: AxiosRequestConfig): string {
  const method = (config.method || "GET").toUpperCase();
  const url = config.url || "";
  const params = config.params ? JSON.stringify(config.params) : "";
  return `${method}:${url}?${params}`;
}

export async function apiRequest<T = unknown>(config: AxiosRequestConfig): Promise<ApiResult<T>> {
  const method = (config.method || "GET").toUpperCase();

  const execute = async (): Promise<ApiResult<T>> => {
    const response = await http.request<T>(config);
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
    };
  };

  if (method !== "GET") {
    return execute();
  }

  const key = buildCacheKey(config);
  const existing = inflightGetMap.get(key) as Promise<ApiResult<T>> | undefined;
  if (existing) {
    return existing;
  }

  const promise = execute().finally(() => {
    inflightGetMap.delete(key);
  }) as Promise<ApiResult<unknown>>;

  inflightGetMap.set(key, promise);
  return promise as Promise<ApiResult<T>>;
}
