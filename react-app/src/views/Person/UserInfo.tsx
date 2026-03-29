import React, { useEffect, useState } from 'react';
import { Button, Avatar, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getUserInfo } from '../../api/api';
import './UserInfo.less';

const UserInfo: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>({});

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await getUserInfo();
      if (res.code === 0) {
        setUserData(res.data);
      } else {
        message.error('获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  const handleEdit = () => {
    const queryParams = new URLSearchParams({
      username: userData.username || '',
      email: userData.email || '',
      mobile: userData.mobile || '',
      address: userData.address || '',
      gender: userData.gender !== undefined ? String(userData.gender) : '',
      nickname: userData.nickname || '',
    }).toString();
    navigate(`/person/editUserInfo?${queryParams}`);
  };

  const handleClose = () => {
    navigate('/home');
  };

  return (
    <div className="user-info-container">
      <div className="user-info-content">
        <div className="avatar-section">
          <span className="label">头像：</span>
          <Avatar 
            size={100} 
            src={userData.headImage} 
            icon={<UserOutlined />} 
            className="avatar"
          />
        </div>
        
        <div className="info-item">
          <span className="label">用户名：</span>
          <span className="value">{userData.username}</span>
        </div>

        <div className="info-item">
          <span className="label">昵称：</span>
          <span className="value">{userData.nickname}</span>
        </div>

        <div className="info-item">
          <span className="label">性别：</span>
          <span className="value">{userData.gender === 0 ? '男' : userData.gender === 1 ? '女' : '未知'}</span>
        </div>

        <div className="info-item">
          <span className="label">电话：</span>
          <span className="value">{userData.mobile}</span>
        </div>

        <div className="info-item">
          <span className="label">邮箱：</span>
          <span className="value">{userData.email}</span>
        </div>
      </div>

      <div className="button-group">
        <Button type="primary" onClick={handleEdit} className="btn-edit">
          修改
        </Button>
        <Button onClick={handleClose}>
          关闭
        </Button>
      </div>
    </div>
  );
};

export default UserInfo;
