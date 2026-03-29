import React, { useEffect, useState } from 'react';
import { Input, Button, Card, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { searchMallInfoByName } from '../api/api';
import './Search.less';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialName = searchParams.get('name') || '';

  const [name, setName] = useState(initialName);
  const [searchInput, setSearchInput] = useState(initialName);
  const [newList, setNewList] = useState<any[]>([]);
  const [day, setDay] = useState<number | undefined>(undefined);
  const [order, setOrder] = useState<string | undefined>(undefined);
  const [timeHover, setTimeHover] = useState(false);
  const [priceHover, setPriceHover] = useState(false);

  const topList = ['数码', '图书音像', '宠物花卉', '美容彩妆', '运动健身'];

  useEffect(() => {
    const queryName = searchParams.get('name') || '';
    setName(queryName);
    setSearchInput(queryName);
  }, [searchParams]);

  useEffect(() => {
    if (name.trim()) {
      searchData();
    }
  }, [name, day, order]);

  const searchData = async () => {
    try {
      const res = await searchMallInfoByName({
        name: name.trim(),
        day,
        order,
      });
      if (res.code === 0) {
        setNewList(res.data.list || []);
      } else {
        message.error(res.msg);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      setSearchParams({ name: searchInput.trim() });
    }
  };

  const handleBack = () => {
    navigate('/trade');
  };

  const timeItems: MenuProps['items'] = [
    { key: '1', label: '1天内', onClick: () => setDay(1) },
    { key: '3', label: '3天内', onClick: () => setDay(3) },
    { key: '7', label: '7天内', onClick: () => setDay(7) },
    { key: '14', label: '14天内', onClick: () => setDay(14) },
  ];

  const priceItems: MenuProps['items'] = [
    { key: 'asc', label: '价格从低到高', onClick: () => setOrder('asc') },
    { key: 'desc', label: '价格从高到低', onClick: () => setOrder('desc') },
  ];

  return (
    <div className="search-container">
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
          <Button type="primary" size="large" style={{ marginLeft: '3rem' }} onClick={handleBack}>
            返回
          </Button>
        </div>
      </header>

      <section className="show">
        <Card style={{ width: '100%', borderRadius: '1rem' }}>
          <div className="show-item">
            <div className="show-item-select">
              <Dropdown menu={{ items: timeItems }}>
                <div
                  className="show-item-select-time"
                  onMouseEnter={() => setTimeHover(true)}
                  onMouseLeave={() => setTimeHover(false)}
                >
                  新发布 {timeHover ? <UpOutlined /> : <DownOutlined />}
                </div>
              </Dropdown>
              <Dropdown menu={{ items: priceItems }}>
                <div
                  className="show-item-select-price"
                  onMouseEnter={() => setPriceHover(true)}
                  onMouseLeave={() => setPriceHover(false)}
                >
                  价格 {priceHover ? <UpOutlined /> : <DownOutlined />}
                </div>
              </Dropdown>
            </div>
            <div className="show-item-contain">
              {newList.map((item) => (
                <div key={item.id} className="show-item-box">
                  <Link to={`/detail/${item.id}`}>
                    <img
                      src={item.imageUrls?.[0]}
                      alt=""
                      className="show-item-box-image"
                    />
                    <span className="show-item-box-introduction">
                      {item.description}
                    </span>
                    <span className="show-item-box-price">¥{item.price}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Search;
