import React, { useEffect, useState } from 'react';
import { Divider, Empty, message } from 'antd';
import { Link } from 'react-router-dom';
import { getListMyCommodity } from '../../api/api';
import './GoodsPublish.less';

const GoodsPublish: React.FC = () => {
  const [newList, setNewList] = useState<any[]>([]);

  useEffect(() => {
    fetchMyCommodities();
  }, []);

  const fetchMyCommodities = async () => {
    try {
      const res = await getListMyCommodity();
      if (res.code === 0) {
        setNewList(res.data.list || []);
      } else {
        // Handle case where data might be null or empty
        setNewList([]);
      }
    } catch (error) {
      console.error('获取商品列表失败:', error);
      message.error('获取商品列表失败');
    }
  };

  return (
    <div className="goods-publish-container">
      <h3 className="show-box-title">商品发布</h3>
      <Divider />
      
      <div className="show-item">
        <div className="show-item-contain">
          {newList.length > 0 ? (
            newList.map((item) => (
              <div key={item.id} className="show-item-box">
                <Link to={`/detail/${item.id}?backSelect=true`}>
                  <img 
                    src={item.imageUrls?.[0]} 
                    alt={item.name} 
                    className="show-item-box-image" 
                  />
                  <span className="show-item-box-introduction">
                    {item.description}
                  </span>
                  <span className="show-item-box-price">¥{item.price}</span>
                </Link>
              </div>
            ))
          ) : (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Empty description="暂无发布商品" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoodsPublish;
