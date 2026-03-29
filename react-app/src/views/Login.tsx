import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { registerApi } from '../api/api';
import { loginUser } from '../store/userSlice';
import type { AppDispatch } from '../store';
import './Login.less';
import loginImage from '../assets/images/loginImage.png';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    if (isLogin) {
      try {
        const resultAction = await dispatch(loginUser({ username: values.username, password: values.password }));
        if (loginUser.fulfilled.match(resultAction)) {
          const res = resultAction.payload;
          if (res.code === 0) {
            message.success('登录成功');
            localStorage.setItem('access_token', res.data.access_token);
            navigate('/home');
          } else {
            message.error(res.msg || '用户名或密码错误');
          }
        } else {
           message.error('登录失败');
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      if (values.password !== values.confirmPassword) {
        message.error('两次输入密码不一致');
        return;
      }
      try {
        const res = await registerApi({ username: values.username, password: values.password });
        if (res.code === 0) {
          message.success(res.msg || '注册成功');
          setIsLogin(true);
          form.resetFields();
        } else {
          message.error(res.msg || '注册失败');
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    form.resetFields();
  };

  return (
    <div className="item-login">
      <div className="item-login-wrap">
        <div className="item-login-left">
          <img src={loginImage} alt="登录图片" className="item-login-left-image" />
        </div>

        <div className="item-login-right">
          <div className="hanging-circle">
            <div className="wire"></div>
            <div className="circle" onClick={toggleMode}>
              {isLogin ? '注册' : '登录'}
            </div>
          </div>
          <div className="item-login-right-main">
            <div className="item-login-right-main-title">{isLogin ? '登录' : '注册'}</div>
            
            <Form
              form={form}
              name="login-form"
              onFinish={onFinish}
              layout="vertical"
              autoComplete="off"
            >
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { pattern: /^[a-zA-Z0-9]+$/, message: '用户名只能是英文和数字' }
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>

              <Form.Item
                label="密码"
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, max: 15, message: '长度在 6 到 15 个字符' }
                ]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>

              {!isLogin && (
                <Form.Item
                  label="确认密码"
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请再次输入密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入密码不一致'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="请再次输入密码" />
                </Form.Item>
              )}

              <Form.Item>
                <Button type="primary" htmlType="submit" className="item-login-right-main-btn">
                  {isLogin ? '登录' : '注册'}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
