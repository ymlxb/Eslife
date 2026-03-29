import React from 'react';
import { Form, Input, Button, Divider, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { upUserPwd } from '../../api/api';
import './UpPassWord.less';

const UpPassWord: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('新密码和确认密码不匹配');
      return;
    }

    try {
      const res = await upUserPwd({
        password: values.password,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      });
      
      if (res.code === 0) {
        message.success('修改成功');
        navigate('/person/userInfo');
      } else {
        message.error(res.msg || '修改失败');
        form.resetFields();
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      message.error('修改失败');
    }
  };

  return (
    <div className="up-password-container">
      <h3 className="show-box-title">修改密码</h3>
      <Divider />
      
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        onFinish={onFinish}
        className="password-form"
      >
        <Form.Item
          label="原密码"
          name="password"
          rules={[{ required: true, message: '请输入原密码' }]}
        >
          <Input.Password placeholder="请输入原密码" />
        </Form.Item>

        <Form.Item
          label="新密码"
          name="newPassword"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, max: 15, message: '长度在 6 到 15 个字符' }
          ]}
        >
          <Input.Password placeholder="请输入新密码" />
        </Form.Item>

        <Form.Item
          label="确认密码"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请确认新密码' },
            { min: 6, max: 15, message: '长度在 6 到 15 个字符' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致!'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="请确认新密码" />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
          <Button type="primary" htmlType="submit" className="btn-submit">
            提交
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default UpPassWord;
