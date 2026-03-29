import React, { useEffect } from 'react';
import { Menu, Dropdown, Avatar, message } from 'antd';
import { HomeOutlined, QuestionCircleOutlined, SyncOutlined, PayCircleOutlined, UserOutlined, MessageOutlined, RobotOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutApi } from '../api/api';
import { fetchUserInfo, clearUserInfo } from '../store/userSlice';
import type { RootState, AppDispatch } from '../store';

const CommonHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const userAvatarUrl = useSelector((state: RootState) => state.user.userAvatarUrl);

  useEffect(() => {
    if (!userAvatarUrl) {
      dispatch(fetchUserInfo());
    }
  }, [dispatch, userAvatarUrl]);

  const handleLogout = async () => {
    try {
      await logoutApi();
      localStorage.removeItem('access_token');
      dispatch(clearUserInfo());
      navigate('/login');
    } catch (error) {
      console.error(error);
      message.error('Logout failed');
    }
  };

  const menuItems = [
    { key: '/home', icon: <HomeOutlined />, label: '首页' },
    { key: '/guide', icon: <QuestionCircleOutlined />, label: '绿色生活指南' },
    { key: '/brand', icon: <SyncOutlined />, label: '可持续品牌' },
    { key: '/trade', icon: <PayCircleOutlined />, label: '二手交易' },
    { key: '/community', icon: <UserOutlined />, label: '社区论坛' },
    { key: '/about', icon: <UserOutlined />, label: '关于我们' },
    { key: '/im', icon: <MessageOutlined />, label: '聊天室' },
    { key: '/ai', icon: <RobotOutlined />, label: 'AI助手' },
    { key: '/carbon', icon: <EnvironmentOutlined />, label: '碳足迹' },
  ];

  const userMenu = {
    items: [
      { key: 'profile', label: '个人中心', onClick: () => navigate('/person/userInfo') },
      { key: 'logout', label: '退出', onClick: handleLogout },
    ]
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', background: '#fff', boxShadow: '0 2px 8px #f0f1f2' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/src/assets/images/Logo.png" alt="logo" style={{ height: 40, marginRight: 10 }} />
        <h1 style={{ margin: 0, fontSize: 20 }}>绿脉永续</h1>
      </div>
      
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={(e) => navigate(e.key)}
        style={{ flex: 1, borderBottom: 'none', justifyContent: 'center' }}
      />

      <Dropdown menu={userMenu}>
        <div style={{ cursor: 'pointer' }}>
          <Avatar src={userAvatarUrl} icon={<UserOutlined />} />
        </div>
      </Dropdown>
    </div>
  );
};

export default CommonHeader;
