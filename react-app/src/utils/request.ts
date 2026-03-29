import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { message } from 'antd';

// Define the expected response structure
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export const baseURL = "http://localhost:8081";

const instance = axios.create({
  baseURL,
  timeout: 40 * 1000,
});

// 是否正在刷新Token的标记
let isRefreshing = false;
// 重试队列，保存需要等待新Token的请求回调
let requestsQueue: Array<(token: string) => void> = [];


const refreshToken = async () => {
  const refreshTokenStr = localStorage.getItem('refresh_token');
  return axios.post(`${baseURL}/api/refreshToken`, { token: refreshTokenStr });
};

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (res: AxiosResponse) => {
    if (res.data && res.data.code === 401) {
      return handleUnauthorized(res.config);
    }

    return res.data;
  },
  (error) => {
    // 兼容 HTTP 状态码为 401 的情况
    if (error.response && error.response.status === 401) {
      return handleUnauthorized(error.config);
    }
    message.error(error.message || '网络错误');
    return Promise.reject(error);
  }
);

// 处理 Token 过期 / 401 的核心逻辑
const handleUnauthorized = (config: InternalAxiosRequestConfig) => {
  if (!isRefreshing) {
    isRefreshing = true;
    
    // 发起刷新Token的请求
    return refreshToken().then((res) => {
      // 假设后端返回的新token在 res.data.data.token
      const newToken = res.data?.data?.token || res.data?.token;
      
      if (newToken) {
        // 更新本地Token
        localStorage.setItem('access_token', newToken);
        instance.defaults.headers.common['Authorization'] = newToken;
        
        // 重新执行队列中的请求
        requestsQueue.forEach((cb) => cb(newToken));
        // 清空队列
        requestsQueue = [];
        
        // 重试当前刚好过期的这个请求
        config.headers.Authorization = newToken;
        return instance(config);
      } else {
        throw new Error('Refresh token invalid');
      }
    }).catch((refreshErr) => {
      // 刷新失败（例如refresh_token也过期），清空登录态并跳转回登录页
      requestsQueue = []; // 清空队列
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      message.error('登录已过期，请重新登录！');
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    }).finally(() => {
      isRefreshing = false;
    });
  } else {
    // 正在刷新时，将并发请求存入队列
    return new Promise((resolve) => {
      requestsQueue.push((newToken: string) => {
        config.headers.Authorization = newToken;
        // token刷新后，将config传入正常的instance继续发出请求
        resolve(instance(config));
      });
    });
  }
};

const request = async <T = unknown>(config: InternalAxiosRequestConfig | Record<string, unknown>): Promise<T> => {
  return instance(config);
};

export default request;
