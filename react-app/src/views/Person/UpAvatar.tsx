import React, { useState, useEffect } from 'react';
import { Upload, Button, message, Divider, Avatar } from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { baseURL } from '../../utils/request';
import { getUserInfo } from '../../api/api';
import './UpAvatar.less';

const UpAvatar: React.FC = () => {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await getUserInfo();
      if (res.code === 0) {
        setAvatarUrl(res.data.headImage);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jfif';
    if (!isJpgOrPng) {
      message.error('图片必须是jpg,png或jfif格式');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过2MB');
    }
    return isJpgOrPng && isLt2M;
  };

  const handleChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'done') {
      if (info.file.response && info.file.response.code === 0) {
        message.success('头像上传成功');
        setAvatarUrl(info.file.response.data);
        // Optionally navigate or refresh
        // navigate('/person/userInfo');
      } else {
        message.error(info.file.response?.msg || '上传失败');
      }
    } else if (info.file.status === 'error') {
      message.error('上传失败');
    }
  };

  return (
    <div className="up-avatar-container">
      <h3 className="show-box-title">修改头像</h3>
      <Divider />
      
      <div className="avatar-section">
        <div className="label">头像：</div>
        <div className="avatar-wrapper">
          <Avatar 
            size={100} 
            src={avatarUrl} 
            icon={<UserOutlined />} 
            className="avatar"
          />
          <Upload
            name="file" // Check if backend expects 'file' or 'image'
            action={`${baseURL}/sys/user/updateImage`}
            headers={{ Authorization: token || '' }}
            method="PUT"
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handleChange}
          >
            <Button icon={<UploadOutlined />}>更换头像</Button>
          </Upload>
        </div>
      </div>
    </div>
  );
};

export default UpAvatar;
