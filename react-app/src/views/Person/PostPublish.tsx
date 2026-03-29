import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Pagination, Popconfirm, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { getPost, deletePost } from '../../api/api';
import './PostPublish.less';

const PostPublish: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [postList, setPostList] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPostList();
  }, [currentPage, pageSize]);

  const fetchPostList = async () => {
    setLoading(true);
    try {
      const params = {
        currentPage,
        pageSize,
        title: searchKeyword
      };
      const res = await getPost(params);
      if (res.code === 0) {
        setPostList(res.data.list || res.data); // Adjust based on actual API response structure
        setTotal(res.data.total || 0);
      } else {
        message.error('获取帖子列表失败');
      }
    } catch (error) {
      console.error('获取帖子列表失败:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPostList();
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deletePost(id);
      if (res.code === 0) {
        message.success('删除成功');
        fetchPostList();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <Link to={`/post/${record.id}`} className="post-title">
          {text}
        </Link>
      ),
    },
    {
      title: '分类',
      dataIndex: ['type', 'name'],
      key: 'type',
      width: 120,
    },
    {
      title: '发布时间',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 180,
    },
    {
      title: '评论数',
      dataIndex: 'totalLevelNumber',
      key: 'totalLevelNumber',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Popconfirm
          title="确定要删除该帖子吗？"
          onConfirm={() => handleDelete(record.id)}
          okText="是"
          cancelText="否"
        >
          <Button type="link" danger size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="post-publish-container">
      <div className="header">
        <div className="card-header">
          <span className="title">发帖记录</span>
          <Input
            placeholder="搜索帖子标题"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            className="search-input"
            suffix={<SearchOutlined onClick={handleSearch} style={{ cursor: 'pointer' }} />}
            allowClear
          />
        </div>
      </div>

      <Table
        loading={loading}
        dataSource={postList}
        columns={columns}
        rowKey="id"
        pagination={false}
        bordered
      />

      <div className="pagination-container">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          showQuickJumper
          showTotal={(total) => `共 ${total} 条`}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
        />
      </div>
    </div>
  );
};

export default PostPublish;
