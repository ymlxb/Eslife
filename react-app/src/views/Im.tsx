import React, { useEffect, useState, useRef } from 'react';
import { Card, Avatar, Input, Button, Tag, List, message, Badge } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';
import { getUserInfo, getChatList, getMallInfoById } from '../api/api';
import { useWebSocket } from '../hooks/useWebSocket';
import './Im.less';

const Im: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get('sellerId');
  
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const { isOnline, sendMessage: wsSendMessage, latestMessage } = useWebSocket(wsUrl);

  const [currentSeller, setCurrentSeller] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [toName, setToName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [sendMessage, setSendMessage] = useState({
    toName: '',
    fromName: '',
    content: '',
    fromImage: '',
    toImage: ''
  });
  const [historyMessage, setHistoryMessage] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
  
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // 初始化：获取用户信息，设置 WebSocket URL
  useEffect(() => {
    init();
  }, []);

  // 监听 WebSocket 推送过来的最新消息
  useEffect(() => {
    if (!latestMessage) return;

    console.log("服务端推送过来的消息：", latestMessage);      
    
    if (Array.isArray(latestMessage)) {
      // 如果收到的是数组，说明是系统推送的好友列表
      const friends = latestMessage
        .filter((user: any) => user.userName !== username)
        .map((user: any) => ({
          username: user.userName,
          headImage: user.headImage || defaultAvatar
        }));
      setFriendsList(friends);
    } else {
      // 如果是单条对象，说明是聊天消息
      // 只有当消息属于当前正在聊天的对象时，才添加到历史记录中显示
      if (latestMessage.fromName === toName || latestMessage.toName === toName) {
         setHistoryMessage(prev => [...prev, latestMessage]);
      }

      // 如果收到别人的消息，且不是当前正在聊天的对象，增加未读计数
      if (latestMessage.fromName !== username && latestMessage.fromName !== toName) {
        setUnreadCounts(prev => ({
          ...prev,
          [latestMessage.fromName]: (prev[latestMessage.fromName] || 0) + 1
        }));
      }
    }
  }, [latestMessage, username, toName]);

  // 连接建立且有目标商家时，自动进入聊天状态
  useEffect(() => {
    if (currentSeller && !toName) {
      showChat(currentSeller.sellerName);
    }
  }, [currentSeller, toName]);

  const init = async () => {
    try {
      const res = await getUserInfo();
      if (res.code === 0) {
        setAvatar(res.data.headImage);
        setUsername(res.data.username);
        setSendMessage(prev => ({ ...prev, fromImage: res.data.headImage }));
        
        if (sellerId) {
          const sellerInfo = await getMallInfoById(sellerId);
          if (sellerInfo.code === 0) {
            setCurrentSeller(sellerInfo.data);
            setSendMessage(prev => ({ ...prev, toImage: sellerInfo.data.sellerHead }));
          }
        }
        
        // 设置 WebSocket URL，这会触发 useWebSocket 内部的 connect
        setWsUrl(`ws://localhost:8090/chat/chat/${res.data.username}`);
      }
    } catch (error) {
      console.error('初始化失败:', error);
    }
  };

  const showChat = async (name: string) => {
    console.log("开始与用户聊天:", name);
    setToName(name);
    
    // 清除该用户的未读消息
    setUnreadCounts(prev => ({ ...prev, [name]: 0 }));
    
    try {
      // 切换聊天对象时，先获取历史记录
      const chatList = await getChatList(name);
      if (chatList.code === 0) {
        setHistoryMessage(chatList.data);
      }
    } catch (error) {
      console.error('获取聊天记录失败:', error);
    }

    // 更新当前聊天对象的头像等信息
    const seller = friendsList.find(f => f.username === name);
    if (seller) {
      setCurrentSeller({
        sellerName: seller.username,
        sellerHead: seller.headImage,
        shopName: seller.username
      });
      setSendMessage(prev => ({ ...prev, toImage: seller.headImage }));
    }
  };

  const handleSubmit = () => {
    if (!sendMessage.content.trim()) {
      message.error("请输入聊天内容");
      return;
    }

    const msg = {
      ...sendMessage,
      toName: toName,
      fromName: username,
      content: sendMessage.content.trim()
    };

    console.log("发送的消息：", msg);

    // 1. 乐观更新：不等服务器响应，直接显示在界面上，体验更好
    setHistoryMessage(prev => [...prev, JSON.parse(JSON.stringify(msg))]);
    
    // 2. 通过 WebSocket 发送给服务器
    wsSendMessage(msg);

    // 3. 清空输入框
    setSendMessage(prev => ({ ...prev, content: '' }));
  };

  const isTargetOnline = friendsList.some(f => f.username === toName);

  return (
    <div className="taobao-chat">
      {/* 聊天窗口 */}
      <div className="chat-window">
        <div className="chat-header">
          <div className="seller-info">
            <Avatar size={40} src={currentSeller?.sellerHead || avatar} icon={<UserOutlined />} />
            <div className="seller-detail">
              <div className="seller-name">
                {currentSeller?.shopName || toName}
              </div>
              <div className="seller-status">
                <Badge status={isTargetOnline ? "success" : "default"} text={isTargetOnline ? "在线" : "离线"} />
              </div>
            </div>
          </div>
        </div>

        {toName && (
          <Virtuoso
            ref={virtuosoRef}
            className="message-area"
            data={historyMessage}
            initialTopMostItemIndex={historyMessage.length - 1}
            followOutput="smooth"
            itemContent={(index, msg) => (
              <div 
                key={index} 
                className={`message-item ${msg.fromName === username ? 'message-sent' : 'message-received'}`}
                style={{ paddingBottom: '2rem', paddingTop: index === 0 ? '2rem' : 0 }}
              >
                <div className="message-content">
                  {msg.fromName !== username && (
                    <Avatar size={40} src={msg.fromImage || defaultAvatar} className="avatar-left" />
                  )}
                  <div className="message-bubble">
                    <div className="message-text">{msg.content}</div>
                  </div>
                  {msg.fromName === username && (
                    <Avatar size={40} src={avatar} className="avatar-right" />
                  )}
                </div>
              </div>
            )}
          />
        )}

        {toName && (
          <div className="chat-footer">
            <div className="input-area">
              <Input.TextArea
                value={sendMessage.content}
                onChange={(e) => setSendMessage(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
                style={{ resize: 'none', marginBottom: '1rem' }}
                placeholder="请输入消息..."
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button
                type="primary"
                className="send-btn"
                disabled={!sendMessage.content.trim()}
                onClick={handleSubmit}
              >
                发送
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 用户侧边栏 */}
      <div className="user-sidebar">
        <Card 
          title={
            <div className="card-header">
              <span>用户</span>
              <Tag color="success" style={{ marginLeft: '10px' }}>{friendsList.length}人</Tag>
            </div>
          }
          className="user-list"
        >
          <List
            dataSource={friendsList}
            renderItem={(friend) => (
              <List.Item 
                onClick={() => showChat(friend.username)}
                style={{ cursor: 'pointer', backgroundColor: toName === friend.username ? '#e6f7ff' : 'transparent' }}
              >
                <List.Item.Meta
                  avatar={
                    <Badge count={unreadCounts[friend.username]} size="small">
                      <Avatar size={30} src={friend.headImage || defaultAvatar} />
                    </Badge>
                  }
                  title={friend.username}
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
};

export default Im;
