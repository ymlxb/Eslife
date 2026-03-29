import React, { useEffect, useState } from 'react';
import { Card, Button, Carousel, Divider, Avatar, message, Popconfirm } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, MessageOutlined } from '@ant-design/icons';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getMallInfoById, deleteCommodity } from '../api/api';
import './Detail.less';

const Detail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const backSelect = searchParams.get('backSelect');
  
  const [mallData, setMallData] = useState<any>({
    id: '',
    name: '',
    description: '',
    createDate: '',
    sellerName: '',
    imageUrls: [],
    price: '',
    tagName: '',
    sellerHead: '',
    mobile: '',
    email: ''
  });

  useEffect(() => {
    if (id) {
      fetchMallInfo(id);
    }
  }, [id]);

  const fetchMallInfo = async (commodityId: string) => {
    try {
      const res = await getMallInfoById(commodityId);
      if (res.code === 0) {
        setMallData(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleBack = () => {
    if (backSelect) {
      navigate('/person/goodsPublish');
    } else {
      navigate('/trade');
    }
  };

  const handleDeleteCommodity = async () => {
    if (!id) return;
    try {
      const res = await deleteCommodity(id);
      if (res.code === 0) {
        message.success('删除成功');
        navigate('/person/goodsPublish');
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error(error);
      message.error('删除失败');
    }
  };

  const handleEditInfo = () => {
    const params = new URLSearchParams({
      id: mallData.id,
      name: mallData.name,
      description: mallData.description,
      price: mallData.price,
      mobile: mallData.mobile,
      email: mallData.email,
      tagName: mallData.tagName,
    });
    // Note: images array is not passed in query params to avoid URL length issues. 
    // EditMallInfo should ideally fetch data by ID or handle missing images in query.
    navigate(`/editMall?${params.toString()}`);
  };

  const handleContactSeller = () => {
    const sellerId = mallData.id;
    navigate(`/im?sellerId=${sellerId}`);
  };

  return (
    <div className="detail-container">
      <main>
        <Card className="detail-item">
          <div className="detail-header">
            <div className="merchant-info">
              <Avatar size={40} src={mallData.sellerHead} icon={<UserOutlined />} />
              <span className="merchant-name">{mallData.sellerName}</span>
            </div>

            <div className="action-buttons">
              {!backSelect ? (
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<MessageOutlined />} 
                  onClick={handleContactSeller}
                >
                  联系商家
                </Button>
              ) : (
                <>
                  <Popconfirm
                    title="确定删除这个商品吗？"
                    onConfirm={handleDeleteCommodity}
                    okText="是"
                    cancelText="否"
                  >
                    <Button type="primary" danger size="large" className="btn-back">
                      删除
                    </Button>
                  </Popconfirm>
                  <Button type="primary" size="large" className="btn-back" onClick={handleEditInfo}>
                    修改
                  </Button>
                </>
              )}
              <Button size="large" className="btn-back" onClick={handleBack}>
                返回
              </Button>
            </div>
          </div>

          <div className="product-item">
            <div className="product-images">
              <Carousel autoplay style={{ width: '100%', height: '40rem', overflow: 'hidden' }}>
                {mallData.imageUrls && mallData.imageUrls.length > 0 ? (
                  mallData.imageUrls.map((url: string, index: number) => (
                    <div key={index} className="image-wrapper">
                      <img src={url} alt={`商品图片${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  ))
                ) : (
                  <div className="image-wrapper">
                    <div style={{ height: '40rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
                      暂无图片
                    </div>
                  </div>
                )}
              </Carousel>
            </div>

            <div className="product-introduction">
              <div className="product-title">{mallData.name}</div>
              <span className="product-price">￥{mallData.price}</span>
              <span className="product-condition">发布时间: {mallData.createDate}</span>
              
              <div className="seller-information">
                <Divider>卖家信息</Divider>
                <div className="seller-info-item">
                  <UserOutlined className="info-icon" />
                  <span>商家名称: {mallData.sellerName}</span>
                </div>
                <div className="seller-info-item">
                  <PhoneOutlined className="info-icon" />
                  <span>联系电话: {mallData.mobile}</span>
                </div>
                <div className="seller-info-item">
                  <MailOutlined className="info-icon" />
                  <span>邮箱地址: {mallData.email}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <section className="product-description">
          <Card className="des">
            <div className="des-title">商品描述</div>
            <Divider dashed />
            <div className="des-content">描述: {mallData.description}</div>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Detail;
