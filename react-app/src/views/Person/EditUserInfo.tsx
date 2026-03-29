import React, { useEffect } from 'react';
import { Form, Input, Select, Button, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { upUserInfo } from '../../api/api';
import './EditUserInfo.less';

const EditUserInfo: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();

  useEffect(() => {
    const initialValues = {
      username: searchParams.get('username') || '',
      nickname: searchParams.get('nickname') || '',
      gender: searchParams.get('gender') ? Number(searchParams.get('gender')) : undefined,
      mobile: searchParams.get('mobile') || '',
      email: searchParams.get('email') || '',
      address: searchParams.get('address') || '',
    };
    form.setFieldsValue(initialValues);
  }, [searchParams, form]);

  const onFinish = async (values: any) => {
    try {
      const res = await upUserInfo(values);
      if (res.code === 0) {
        message.success(res.data || '修改成功');
        navigate('/person/userInfo');
      } else {
        message.error(res.msg || '修改失败');
      }
    } catch (error) {
      console.error('修改失败:', error);
      message.error('修改失败');
    }
  };

  const handleCancel = () => {
    navigate('/person/userInfo');
  };

  return (
    <div className="edit-user-info-container">
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        onFinish={onFinish}
        className="edit-form"
      >
        <Form.Item label="用户名" name="username">
          <Input disabled />
        </Form.Item>

        <Form.Item label="昵称" name="nickname">
          <Input placeholder="请输入昵称" />
        </Form.Item>

        <Form.Item label="性别" name="gender">
          <Select placeholder="请选择性别">
            <Select.Option value={0}>男</Select.Option>
            <Select.Option value={1}>女</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="电话" name="mobile">
          <Input placeholder="请输入电话" />
        </Form.Item>

        <Form.Item label="邮箱" name="email">
          <Input placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 4, span: 20 }}>
          <div className="button-group">
            <Button onClick={handleCancel} style={{ marginRight: '1rem' }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              提交
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EditUserInfo;
