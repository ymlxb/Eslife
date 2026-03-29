import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Upload, message, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { addMallInfo, getAllTag } from '../api/api';
import { baseURL } from '../utils/request';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import './MallInfo.less';

const { Option } = Select;
const { TextArea } = Input;

const MallInfo: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [tagDataList, setTagDataList] = useState<string[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await getAllTag();
        if (res.code === 0) {
          setTagDataList(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch tags", error);
      }
    };
    fetchTags();
  }, []);

  const handleCancel = () => {
    navigate('/trade');
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Extract image URLs from fileList
      const images = fileList.map(file => {
        if (file.response && file.response.code === 0) {
          return file.response.data;
        }
        return file.url || '';
      }).filter(url => url);

      if (images.length === 0) {
        message.error('请上传物品照片');
        setLoading(false);
        return;
      }

      const payload = {
        ...values,
        images: images
      };

      const res = await addMallInfo(payload);
      if (res.code === 0) {
        message.success('发布成功');
        navigate('/trade');
      } else {
        message.error(res.message || '发布失败');
      }
    } catch (error) {
      console.error("Submit error", error);
      message.error('发布失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const beforeUpload = (file: UploadFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jfif';
    if (!isJpgOrPng) {
      message.error('图片必须是jpg,png或jfif格式');
    }
    const isLt2M = (file.size || 0) / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过2MB');
    }
    return isJpgOrPng && isLt2M;
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传照片</div>
    </div>
  );

  const token = localStorage.getItem('access_token');

  return (
    <div className="mall-info-container">
      <Card title="发布闲置物品" className="mall-info-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{}}
          scrollToFirstError
        >
          <Form.Item
            name="name"
            label="物品名称"
            rules={[
              { required: true, message: '请输入物品名称' },
              { min: 3, max: 20, message: '长度在 3 到 20 个字符' }
            ]}
          >
            <Input placeholder="请输入物品名称(长度在 3 到 20 个字符)" />
          </Form.Item>

          <Form.Item
            name="price"
            label="出售价格"
            rules={[
              { required: true, message: '请输入出售价格' },
              { type: 'number', message: '价格必须是数字', transform: (value) => Number(value) }
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入出售价格" min={0} />
          </Form.Item>

          <Form.Item
            name="tag"
            label="物品类型"
            rules={[{ required: true, message: '请输入商品类型' }]}
          >
            <Select placeholder="请输入商品类型">
              {tagDataList.map((tag, index) => (
                <Option key={index} value={tag}>{tag}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="物品描述"
            rules={[
              { required: true, message: '请输入物品描述' },
              { min: 20, max: 100, message: '长度在 20 到 100 个字符' }
            ]}
          >
            <TextArea rows={4} placeholder="请输入物品描述(长度在 20 到 100 个字符)" />
          </Form.Item>

          <Form.Item
            name="mobile"
            label="联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的联系电话' }
            ]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱地址"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入正确的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>

          <Form.Item
            label="物品照片"
            required
          >
            <Upload
              action={`${baseURL}/mall/Commodity/insertImage`}
              headers={{ Authorization: token || '' }}
              listType="picture-card"
              fileList={fileList}
              onPreview={async (file) => {
                let src = file.url as string;
                if (!src) {
                  src = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file.originFileObj as Blob);
                    reader.onload = () => resolve(reader.result as string);
                  });
                }
                const image = new Image();
                image.src = src;
                const imgWindow = window.open(src);
                imgWindow?.document.write(image.outerHTML);
              }}
              onChange={handleChange}
              beforeUpload={beforeUpload}
              maxCount={5}
            >
              {fileList.length >= 5 ? null : uploadButton}
            </Upload>
          </Form.Item>

          <Form.Item>
            <div className="form-actions">
              <Button onClick={handleCancel} style={{ marginRight: 16 }}>
                取消发布
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                立即发布
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default MallInfo;
