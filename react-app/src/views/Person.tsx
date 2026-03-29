import React, { useState } from 'react';
import { Card, Input, Button } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import './Person.less';

const Person: React.FC = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const topList = ['数码', '图书音像', '宠物花卉', '美容彩妆', '运动健身'];

  const handleSearch = () => {
    if (searchInput.trim()) {
      navigate(`/search?name=${searchInput.trim()}`);
    }
  };

  return (
    <div className="person-container">
      <header className="header">
        <div className="navigation">
          {topList.map((item, index) => (
            <div key={index} className="navigation-box">
              <Link to={`/search?name=${item}`} className="link">
                <span className="text">{item}</span>
              </Link>
            </div>
          ))}
          <div className="search-box">
            <Input
              className="search_input"
              placeholder="笔记本电脑"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Button className="search_btn" onClick={handleSearch}>
              搜索
            </Button>
          </div>
        </div>
      </header>

      <section className="main">
        <Card className="left" style={{ width: '20%', minWidth: '200px' }} hoverable>
          <div className="account" style={{ marginBottom: '2rem' }}>
            <h2 className="title">我的账户</h2>
            <p className="title-nav"><Link to="/person/userInfo">个人中心</Link></p>
            <p className="title-nav"><Link to="/person/upAvatar">修改头像</Link></p>
            <p className="title-nav"><Link to="/person/upPassWord">修改密码</Link></p>
          </div>
          <div className="order">
            <h2 className="title">交易管理</h2>
            <p className="title-nav"><Link to="/person/goodsPublish">商品发布</Link></p>
            <p className="title-nav"><Link to="/person/postPublish">帖子发布</Link></p>
          </div>
        </Card>
        <Card className="right" style={{ flex: 1 }} hoverable>
          <Outlet />
        </Card>
      </section>
    </div>
  );
};

export default Person;
