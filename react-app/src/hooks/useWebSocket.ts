import { useCallback, useEffect, useRef, useState } from "react";

// 定义消息类型，可以是任意对象或字符串
type WSMessage = any;

interface UseWebSocketResult {
  isOnline: boolean;               // 当前连接状态
  latestMessage: WSMessage | null; // 收到的最新消息
  sendMessage: (msg: any) => void; // 发送消息的方法
  close: () => void;               // 手动关闭连接
  reconnect: () => void;           // 手动重连
}

/**
 * 自定义 WebSocket Hook
 * 
 * 核心功能：
 * 1. 自动连接与断线重连（指数退避算法）
 * 2. 心跳检测机制（Ping/Pong）保活
 * 3. 消息缓冲队列（断网时发送的消息会在重连后自动补发）
 * 4. 状态管理（在线状态、最新消息）
 * 
 * @param initialUrl WebSocket 服务端地址
 * @returns 包含状态和操作方法的对象
 */
export function useWebSocket(initialUrl: string | null): UseWebSocketResult {
  // --- 状态管理 ---
  // 使用 useRef 存储 URL，避免 useEffect 依赖频繁变化导致不必要的重连
  const urlRef = useRef<string | null>(initialUrl);
  // WebSocket 实例引用，不参与渲染循环
  const wsRef = useRef<WebSocket | null>(null);
  // 在线状态，用于 UI 展示（如：显示"在线/离线"徽标）
  const [isOnline, setIsOnline] = useState(false);
  // 最新收到的一条消息，业务组件通过监听这个状态来处理新消息
  const [latestMessage, setLatestMessage] = useState<WSMessage | null>(null);

  // --- 重连机制配置 ---
  const reconnectAttempts = useRef(0);      // 当前已重试次数
  const maxReconnectAttempts = 10;          // 最大重试次数，防止无限重连消耗资源
  const reconnectTimer = useRef<number | null>(null); // 重连定时器引用，用于清除

  // --- 心跳检测配置 ---
  const heartbeatIntervalMs = 20000;        // 心跳发送间隔 (20秒)
  const heartbeatTimeoutMs = 10000;         // 等待 Pong 响应的超时时间 (10秒)
  const heartbeatIntervalId = useRef<number | null>(null); // 发送 Ping 的定时器
  const heartbeatTimeoutId = useRef<number | null>(null);  // 等待 Pong 的超时定时器

  // --- 消息队列 ---
  // 当连接未建立时，用户发送的消息会被暂存到这里，等连接成功后自动发送
  const sendQueue = useRef<any[]>([]);

  /**
   * 清理所有定时器
   * 在组件卸载、连接关闭或重连前调用，防止内存泄漏和逻辑冲突
   */
  const clearTimers = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (heartbeatIntervalId.current) {
      clearInterval(heartbeatIntervalId.current);
      heartbeatIntervalId.current = null;
    }
    if (heartbeatTimeoutId.current) {
      clearTimeout(heartbeatTimeoutId.current);
      heartbeatTimeoutId.current = null;
    }
  };

  /**
   * 冲刷消息队列
   * 业务逻辑：当连接建立成功(Open)时，检查队列中是否有积压的消息，如果有则依次发送。
   * 保证用户在断网期间的操作不会丢失。
   */
  const flushQueue = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      while (sendQueue.current.length) {
        const m = sendQueue.current.shift(); // 取出队首消息
        try {
          wsRef.current.send(typeof m === "string" ? m : JSON.stringify(m));
        } catch (e) {
          // 如果发送失败（极少情况），放回队首，停止发送，等待下次机会
          sendQueue.current.unshift(m);
          break;
        }
      }
    }
  }, []);

  /**
   * 启动心跳检测
   * 业务逻辑：
   * 1. 定时发送 'ping' 消息给服务端。
   * 2. 发送后立即启动一个超时定时器。
   * 3. 如果在超时时间内收到了服务端的 'pong' (在 handleMessage 中处理)，则清除超时定时器。
   * 4. 如果超时了还没收到 'pong'，说明连接可能已假死（虽然 readyState 是 OPEN，但网线可能拔了），此时主动关闭连接触发重连。
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalId.current) return; // 防止重复启动
    
    heartbeatIntervalId.current = window.setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          // 发送 Ping 消息，携带时间戳
          wsRef.current.send(JSON.stringify({ type: "ping", t: Date.now() }));
          
          // 设置超时检测
          if (heartbeatTimeoutId.current) {
            clearTimeout(heartbeatTimeoutId.current);
          }
          heartbeatTimeoutId.current = window.setTimeout(() => {
            console.warn("心跳超时，主动断开连接");
            wsRef.current?.close(); // 这会触发 onclose，进而触发重连
          }, heartbeatTimeoutMs);
        } catch (e) {
          // 发送失败通常会在 onerror 或 onclose 中处理
        }
      }
    }, heartbeatIntervalMs);
  }, []);

  /**
   * 停止心跳检测
   * 在连接断开时调用，避免在无连接状态下空转定时器
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalId.current) {
      clearInterval(heartbeatIntervalId.current);
      heartbeatIntervalId.current = null;
    }
    if (heartbeatTimeoutId.current) {
      clearTimeout(heartbeatTimeoutId.current);
      heartbeatTimeoutId.current = null;
    }
  }, []);

  /**
   * 调度重连
   * 业务逻辑：指数退避算法 (Exponential Backoff)
   * 随着重试次数增加，等待时间成倍增长 (1s, 2s, 4s, 8s...)，最大不超过 30s。
   * 避免在网络故障时频繁请求导致服务端雪崩或客户端资源耗尽。
   */
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.warn("达到最大重连次数，停止重连");
      return;
    }
    
    reconnectAttempts.current += 1;
    // 计算延迟：min(30秒, 1秒 * 2^(重试次数-1))
    const delay = Math.min(30000, 1000 * 2 ** (reconnectAttempts.current - 1));
    
    console.log(`将在 ${delay}ms 后尝试第 ${reconnectAttempts.current} 次重连`);
    
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectTimer.current = window.setTimeout(() => {
      connect(urlRef.current);
    }, delay);
  }, []);

  /**
   * WebSocket Open 事件处理
   */
  const handleOpen = useCallback(() => {
    console.log("WebSocket 连接成功");
    reconnectAttempts.current = 0; // 重置重连次数
    setIsOnline(true);
    flushQueue();    // 发送积压消息
    startHeartbeat(); // 启动心跳
  }, [flushQueue, startHeartbeat]);

  /**
   * WebSocket Message 事件处理
   */
  const handleMessage = useCallback((ev: MessageEvent) => {
    // 尝试解析 JSON
    let parsed: any = null;
    try {
      parsed = JSON.parse(ev.data);
    } catch {
      parsed = ev.data; // 非 JSON 格式直接使用原始字符串
    }

    // --- 心跳响应处理 ---
    // 如果收到服务端的 Pong，说明连接健康，清除超时定时器
    if (parsed && (parsed.type === "pong" || parsed === "pong")) {
      if (heartbeatTimeoutId.current) {
        clearTimeout(heartbeatTimeoutId.current);
        heartbeatTimeoutId.current = null;
      }
      return; // 心跳消息不作为业务消息暴露给上层
    }

    // 更新最新消息状态
    setLatestMessage(parsed);
  }, []);

  /**
   * WebSocket Close 事件处理
   */
  const handleClose = useCallback(() => {
    console.log("WebSocket 连接关闭");
    setIsOnline(false);
    stopHeartbeat();      // 停止心跳
    scheduleReconnect();  // 触发重连机制
  }, [stopHeartbeat, scheduleReconnect]);

  /**
   * WebSocket Error 事件处理
   */
  const handleError = useCallback(() => {
    console.error("WebSocket 发生错误");
    // 错误通常会紧接着触发 Close 事件，所以这里不需要额外的重连逻辑
    // 可以在这里做一些错误上报
    try {
      wsRef.current?.close();
    } catch {}
  }, []);

  /**
   * 建立连接的核心函数
   */
  const connect = useCallback((url: string | null) => {
    if (!url) return;
    urlRef.current = url;
    
    try {
      // 1. 确保旧连接已关闭
      if (wsRef.current) {
        // 清除旧的事件监听，防止内存泄漏或逻辑干扰
        try { wsRef.current.onopen = wsRef.current.onmessage = wsRef.current.onclose = wsRef.current.onerror = null; } catch {}
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }

      // 2. 创建新连接
      const ws = new WebSocket(url);
      wsRef.current = ws;
      
      // 3. 绑定事件监听
      ws.onopen = handleOpen;
      ws.onmessage = handleMessage;
      ws.onclose = handleClose;
      ws.onerror = handleError;
    } catch (e) {
      console.error("创建 WebSocket 失败:", e);
      scheduleReconnect();
    }
  }, [handleOpen, handleMessage, handleClose, handleError, scheduleReconnect]);

  // --- Effects ---

  // 初始化连接
  useEffect(() => {
    connect(urlRef.current);

    // 组件卸载时的清理函数
    return () => {
      clearTimers();
      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听 URL 变化，如果 URL 变了，重新连接
  useEffect(() => {
    if (initialUrl && initialUrl !== urlRef.current) {
      connect(initialUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  // --- 暴露给外部的方法 ---

  /**
   * 发送消息
   * 如果连接正常，直接发送；如果连接断开，存入队列等待重连。
   */
  const sendMessage = useCallback((msg: any) => {
    const payload = typeof msg === "string" ? msg : JSON.stringify(msg);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(payload);
      } catch (e) {
        console.error("发送失败，存入队列", e);
        sendQueue.current.push(msg);
      }
    } else {
      console.log("当前离线，消息存入队列");
      sendQueue.current.push(msg);
    }
  }, []);

  /**
   * 手动关闭连接
   * 场景：用户注销、切换账号等不需要重连的情况
   */
  const close = useCallback(() => {
    clearTimers();
    reconnectAttempts.current = maxReconnectAttempts; // 设置为最大值，阻止自动重连
    try {
      wsRef.current?.close();
    } catch {}
    wsRef.current = null;
    setIsOnline(false);
  }, []);

  /**
   * 手动重连
   * 场景：用户点击"重试"按钮
   */
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    connect(urlRef.current);
  }, [connect]);

  return {
    isOnline,
    latestMessage,
    sendMessage,
    close,
    reconnect,
  };
}

export default useWebSocket;
