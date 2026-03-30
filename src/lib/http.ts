import axios, { type AxiosRequestConfig } from "axios";

export type ApiResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T;
};

export async function apiRequest<T = unknown>(config: AxiosRequestConfig): Promise<ApiResult<T>> {
  const response = await axios.request<T>({
    withCredentials: true,
    validateStatus: () => true,
    ...config,
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    data: response.data,
  };
}
