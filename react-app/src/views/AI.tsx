import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Avatar, Tag, message as antMessage, Spin } from 'antd';
import { UserOutlined, LoadingOutlined, RobotOutlined } from '@ant-design/icons';
import { getUserInfo } from '../api/api';
import { baseURL } from '../utils/request';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './AI.less';

import aiAvatarImg from '../assets/images/Logo.png';

const { TextArea } = Input;

interface Message {
  content: string;
  isUser: boolean;
  time: Date;
}

const AI: React.FC = () => {
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('');
  const chatContentRef = useRef<HTMLDivElement>(null);

  // 初始化设置
  useEffect(() => {
    const init = async () => {
      try {
        const res = await getUserInfo();
        setUserAvatar(
          res.data.headImage ||
          "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
        );
      } catch (error) {
        console.error("获取用户信息失败", error);
      }

      addMessage({
        content: "你好！我是你的AI环保助手。我可以帮你解答环保相关的问题，比如垃圾分类、节能减排、可持续生活方式等。请随时向我提问！",
        isUser: false,
        time: new Date(),
      });
    };
    init();
  }, []);

  // 当消息变化时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  };

  const addMessage = (msg: Message) => {
    setChatMessages(prev => [...prev, msg]);
  };

  const handleSend = async () => {
    const msgContent = inputMessage.trim();
    if (!msgContent) {
      antMessage.warning("请输入内容");
      return;
    }
    if (loading) return;

    // 添加用户消息
    const userMsg: Message = {
      content: msgContent,
      isUser: true,
      time: new Date(),
    };
    addMessage(userMsg);
    setInputMessage('');
    setLoading(true);

    // 添加 AI 消息占位符
    const aiMsg: Message = {
      content: '',
      isUser: false,
      time: new Date(),
    };
    setChatMessages(prev => [...prev, aiMsg]);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${baseURL}/ai/chat/generate?message=${encodeURIComponent(msgContent)}`, {
        method: 'GET',
        headers: {
          'Authorization': token || '',
          'Accept': 'text/event-stream',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // 简单的 SSE 解析逻辑
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.slice(5).trim();
              if (data === '[DONE]') continue;
              // 假设返回的是纯文本内容，如果是 JSON 需要 JSON.parse(data).content
              aiContent += data;
            } else if (line.trim() !== '' && !line.startsWith('event:') && !line.startsWith('id:') && !line.startsWith('retry:')) {
               // 兼容非标准 SSE 的流式输出
               aiContent += line;
            }
          }

          setChatMessages(prev => {
            const newMsgs = [...prev];
            const lastMsg = newMsgs[newMsgs.length - 1];
            if (!lastMsg.isUser) {
              lastMsg.content = aiContent;
            }
            return newMsgs;
          });
        }
      }
    } catch (error) {
      console.error("AI Chat Error:", error);
      antMessage.error("AI 响应失败");
      setChatMessages(prev => {
        const newMsgs = [...prev];
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (!lastMsg.isUser && !lastMsg.content) {
          lastMsg.content = "抱歉，我暂时无法回答这个问题。";
        }
        return newMsgs;
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: Date) => {
    return new Date(time).toLocaleTimeString();
  };

  const renderMessageContent = (content: string) => {
    // 使用 marked 解析 markdown
    // marked.parse 返回字符串或 Promise<string>。
    // 因为我们在这里同步使用它，我们假设它返回字符串（除非设置了 async: true 选项）
    // 但是，marked v17 默认可能是异步的或返回 promise？
    // 让我们检查 marked 的用法。通常 `marked(content)` 是有效的。
    // 如果它返回 promise，我们可能需要不同的处理方式。
    // 目前假设是同步用法。
    const html = marked.parse(content) as string; 
    const sanitizedHtml = DOMPurify.sanitize(html);
    return { __html: sanitizedHtml };
  };

  return (
    <div className="ai-chat-container">
      <div className="chat-header">
        <h2>AI环保助手</h2>
        <Tag color="success">在线</Tag>
      </div>

      <div className="chat-content" ref={chatContentRef}>
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            className={`message-item ${msg.isUser ? 'user-message' : ''}`}
          >
            <div className="avatar">
              <Avatar 
                size={40} 
                src={msg.isUser ? userAvatar : aiAvatarImg} 
                icon={!msg.isUser && !aiAvatarImg ? <RobotOutlined /> : <UserOutlined />}
              />
            </div>
            <div className="message-content">
              <div 
                className="message-bubble"
                dangerouslySetInnerHTML={renderMessageContent(msg.content)}
              />
              <div className="message-time">{formatTime(msg.time)}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="loading-message">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            <span style={{ marginLeft: 10 }}>AI正在思考中...</span>
          </div>
        )}
      </div>

      <div className="chat-input">
        <TextArea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          rows={3}
          placeholder="请输入您的问题（例如：如何进行垃圾分类？）"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleSend();
            }
          }}
        />
        <div className="input-actions">
          <div className="input-tips">提示：按 Ctrl + Enter 快捷发送</div>
          <Button type="primary" loading={loading} onClick={handleSend}>
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AI;
