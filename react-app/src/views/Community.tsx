import React, { useState, useEffect } from 'react';
import { Button, Tabs, Avatar, Tag, Divider, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { EditOutlined, MessageOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getPosts, getTopics, addPost, deletePost, getUserInfo } from '../api/api';
import './Community.less';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const Community: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('0');
  const [categories, setCategories] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [form] = Form.useForm();
  const [userInfo, setUserInfo] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopics();
    fetchPosts();
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await getUserInfo();
      if (res.code === 0) {
        setUserInfo(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await getTopics();
      if (res.code === 0) {
        const allTopic = { id: '0', name: '全部', icon: 'Menu' };
        setCategories([allTopic, ...res.data]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await getPosts('');
      if (res.code === 0) {
        setPosts(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key);
  };

  const handleNewPost = () => {
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const res = await addPost({ ...values, userId: userInfo?.id });
      if (res.code === 0) {
        message.success('发布成功');
        setShowDialog(false);
        form.resetFields();
        fetchPosts();
      } else {
        message.error(res.msg || '发布失败');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deletePost(id);
      if (res.code === 0) {
        message.success('删除成功');
        fetchPosts();
      } else {
        message.error(res.msg || '删除失败');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const navigateToPost = (id: string) => {
    navigate(`/detail/${id}`);
  };

  const filteredPosts = activeCategory === '0' 
    ? posts 
    : posts.filter(post => post.type.id === activeCategory);

  const canDelete = (post: any) => {
    return userInfo && (userInfo.id === post.userId || userInfo.role === 'admin');
  };

  return (
    <div className="community-container">
      <header className="community-header">
        <div className="header-content">
          <h1 className="title">绿色生活社区</h1>
          <p className="subtitle">分享可持续生活经验，共建美好家园</p>
          <Button
            type="primary"
            shape="round"
            icon={<EditOutlined />}
            onClick={handleNewPost}
            className="post-button"
            size="large"
          >
            发布新话题
          </Button>
        </div>
      </header>

      <main className="community-main">
        <section className="category-nav">
          <Tabs activeKey={activeCategory} onChange={handleCategoryChange} centered>
            {categories.map(category => (
              <TabPane tab={category.name} key={category.id} />
            ))}
          </Tabs>
        </section>

        <section className="post-list">
          {filteredPosts.map(post => (
            <div key={post.id} className="post-item" onClick={() => navigateToPost(post.id)}>
              <div className="post-avatar">
                <Avatar src={post.headImage} size={50} />
              </div>
              <div className="post-content">
                <h3 className="post-title">
                  <Tag color="success" className="category-tag">
                    {post.type.name}
                  </Tag>
                  <span className="title-text">{post.title}</span>
                </h3>
                <div className="post-meta">
                  <span className="author">{post.nickname}</span>
                  <Divider type="vertical" />
                  <span className="time">{post.createDate}</span>
                  <Divider type="vertical" />
                  <span className="stat">
                    <MessageOutlined /> {post.totalLevelNumber}
                  </span>
                </div>
                <p className="post-excerpt">{post.excerpt}</p>
              </div>
              {canDelete(post) && (
                <Popconfirm
                  title="确定删除这个帖子吗？"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    handleDelete(post.id);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="是"
                  cancelText="否"
                >
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    className="delete-btn"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              )}
            </div>
          ))}
        </section>
      </main>

      <Modal
        title="发布新帖"
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item
            name="typeId"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              {categories.filter(c => c.id !== '0').map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={6} placeholder="分享你的想法..." />
          </Form.Item>
          <Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button onClick={() => setShowDialog(false)} style={{ marginRight: 8 }}>取消</Button>
              <Button type="primary" htmlType="submit">发布</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Community;
