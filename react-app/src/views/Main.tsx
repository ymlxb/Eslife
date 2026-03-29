import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import CommonHeader from '../components/CommonHeader';
import ScrollToTop from '../components/ScrollToTop';

const { Header, Content, Footer } = Layout;

const Main: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <ScrollToTop />
      <Header style={{ padding: 0, background: '#fff', height: 'auto', lineHeight: 'normal' }}>
        <CommonHeader />
      </Header>
      <Content style={{ padding: '20px', background: '#f0f2f5' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Sustainable Living Platform ©2025
      </Footer>
    </Layout>
  );
};

export default Main;
