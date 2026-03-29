import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Carousel, message, Card } from 'antd';
import { 
  PlusCircleOutlined, 
  RightOutlined,
  DesktopOutlined,
  SkinOutlined,
  CarOutlined,
  HomeOutlined,
  ReadOutlined,
  TrophyOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { throttle } from 'lodash';
import { getAllMallInfo, searchMallInfoByName, searchMallInfoByTag } from '../api/api';
import LazyImage from '../components/LazyImage';
import './Trade.less';

import home1 from '../assets/images/home1.png';
import home2 from '../assets/images/home2.png';
import home3 from '../assets/images/home3.png';

const Trade: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [topList] = useState(['数码', '图书音像', '宠物花卉', '美容彩妆', '运动健身']);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [messageNewList, setMessageNewList] = useState<any[]>([]);
  const [newList, setNewList] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const headerImages = [
    { url: home1 },
    { url: home2 },
    { url: home3 },
  ];

  const list = [
    { name: '数码', icon: <DesktopOutlined /> },
    { name: '服饰鞋帽', icon: <SkinOutlined /> },
    { name: '汽摩生活', icon: <CarOutlined /> },
    { name: '家居生活', icon: <HomeOutlined /> },
    { name: '图书音像', icon: <ReadOutlined /> },
    { name: '运动健身', icon: <TrophyOutlined /> },
   
  ];

  const items = [
    { name: '闲置好物' },
    { name: '数码' },
    { name: '服饰鞋帽' },
    { name: '家具电器' },
    { name: '家居生活' },
    { name: '图书音像' },
    { name: '宠物花卉' },
    { name: '文玩玉翠' },
    { name: '汽摩生活' },
    { name: '运动健身' },
    { name: '美容彩妆' },
    { name: '模玩动漫' },
    { name: '其他' },
  ];

  // 获取最新列表
  const getNewList = async () => {
    try {
      const res = await getAllMallInfo();
      if (res && res.data) {
        setNewList(res.data.list);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getNewList();
    // 处理路由参数中的 id (Vue 代码中有 const commodityId = route.query.id; 但似乎没用到)
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    if (id) {
      console.log('Commodity ID:', id);
    }
  }, [location]);

  const goToDetail = (id: string | number) => {
    navigate(`/Detail/${id}`);
  };

  const handleSearch = async () => {
    const name = searchInputRef.current?.value;
    if (name) {
      try {
        const res = await searchMallInfoByName({ name });
        if (res.code === 0) {
          navigate(`/Search?name=${name}`);
        } else {
          message.error(res.msg || '未查询到该商品');
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      getNewList();
    }
  };

  const searchByTag = async (tag: string) => {
    try {
      const res = await searchMallInfoByTag({ tag, number: 0 });
      if (res.data === null) {
        message.error(res.msg || '未查询到该商品');
      }
      if (res.code === 0) {
        setNewList(res.data.list);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const changeCom = (index: number) => {
    setActiveIndex(index);
    const tag = items[index].name;
    searchByTag(tag);
  };

  // 节流查询消息列表
  const fetchMessageList = async (tag: string) => {
    try {
      const res = await searchMallInfoByTag({ tag, number: 6 });
      if (res.data === null) {
        // message.error(res.msg); // 悬停时不报错比较好
      }
      if (res.code === 0) {
        setMessageNewList(res.data.list);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const throttleMessage = useCallback(throttle((tag: string) => {
    fetchMessageList(tag);
  }, 500), []);

  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    const text = (e.target as HTMLElement).innerText;
    if (text) {
      setShowMessageBox(true);
      throttleMessage(text);
    }
  };

  return (
    <div className="trade-contain">
      <header className="header">
        <div className="navigation">
          {topList.map((item, index) => (
            <div 
              className="navigation-box" 
              key={index} 
              onMouseEnter={handleMouseOver}
            >
              <Link to="#" className="link" onClick={(e) => e.preventDefault()}>
                <span className="text">{item}</span>
              </Link>
            </div>
          ))}

          <div className="search">
            <input 
              type="text" 
              className="search_input" 
              placeholder="笔记本电脑" 
              ref={searchInputRef}
            />
            <button className="search_btn" onClick={handleSearch}>搜索</button>
          </div>
          
          <div className="toolbar">
            <div className="toolbar-item">
              <Link to="/Mall">
                <div>
                  <PlusCircleOutlined className="toolbar-item--icon" />
                </div>
                <span className="toolbar-content">发闲置</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div 
        className="messageBox" 
        style={{ display: showMessageBox ? 'block' : 'none' }} 
        onMouseLeave={() => setShowMessageBox(false)}
      >
        <div className="messageBox-box">
          {messageNewList.map((item, index) => (
            <div 
              className="messageBox-box-item" 
              key={index}
              onClick={() => goToDetail(item.id)}
            >
              <img src={item.imageUrls?.[0]} alt="" className="messageBox-box-item-image" />
              <p className="messageBox-box-item-name">{item.name}</p>
              <p className="messageBox-box-item-price">¥{item.price}</p>
            </div>
          ))}
        </div>
      </div>

      <main>
        <section className="contents">
          <Card style={{ width: '100%', borderRadius: '1rem' }} bodyStyle={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div className="contents-item">
                {list.map((item, index) => (
                  <div className="contents-item-box" key={index}>
                    <div className="contents-item--icon margin-left-1">
                      <span className="icons">{item.icon}</span>
                    </div>
                    <div className="contents-item--text margin-left-1">
                      <Link to={`/search?name=${item.name}`}>
                        <span className="contents-item--text-title margin-left-1">{item.name}</span>
                      </Link>
                    </div>
                    <RightOutlined className="icon-right" />
                  </div>
                ))}
              </div>
              <div className="contents-images">
                <Carousel autoplay className="contents-images-box">
                  {headerImages.map((item, index) => (
                    <div key={index}>
                      <img src={item.url} width="100%" alt="banner" className="contents-images-box" style={{ objectFit: 'cover' }} />
                    </div>
                  ))}
                </Carousel>
              </div>
            </div>
          </Card>
        </section>

        <section className="show">
          <Card style={{ width: '100%', borderRadius: '1rem' }} bodyStyle={{ padding: '20px' }}>
            <div className="show-item">
              <div className="show-item-nav">
                {items.map((item, index) => (
                  <div 
                    key={index}
                    className={`show-item-nav-box ${activeIndex === index ? 'active' : ''}`}
                    onClick={() => changeCom(index)}
                  >
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
              <div className="show-item-contain">
                {newList.map((item) => (
                  <div className="show-item-box" key={item.id}>
                    <Link to={`/Detail/${item.id}`}>
                      <LazyImage 
                        src={item.imageUrls?.[0]} 
                        alt={item.name} 
                        className="show-item-box-image" 
                      />
                      <span className="show-item-box-introduction">{item.description}</span>
                      <span className="show-item-box-price">¥{item.price}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Trade;
