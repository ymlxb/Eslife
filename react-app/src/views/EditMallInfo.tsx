import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, message, Card } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { upCommodity, getAllTag } from '../api/api';
import './MallInfo.less'; // Reuse styles

const { Option } = Select;
const { TextArea } = Input;

const EditMallInfo: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tagDataList, setTagDataList] = useState<string[]>([]);
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

    // Set initial values from search params
    const initialValues = {
      id: searchParams.get('id'),
      name: searchParams.get('name'),
      price: Number(searchParams.get('price')),
      description: searchParams.get('description'),
      mobile: searchParams.get('mobile'),
      email: searchParams.get('email'),
      tag: searchParams.get('tagName'), // Note: Vue used 'tagName' in query but 'tag' in form
      images: searchParams.get('images') // Preserving images even if not editable
    };
    form.setFieldsValue(initialValues);
  }, [form, searchParams]);

  const handleCancel = () => {
    navigate('/trade');
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        id: searchParams.get('id'), // Ensure ID is included
        images: searchParams.get('images') // Ensure images are preserved
      };

      const res = await upCommodity(payload);
      if (res.code === 0) {
        message.success('修改成功');
        navigate('/trade');
      } else {
        message.error(res.message || '修改失败');
      }
    } catch (error) {
      console.error("Submit error", error);
      message.error('修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mall-info-container">
      <Card title="修改商品信息" className="mall-info-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
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

          <Form.Item>
            <div className="form-actions">
              <Button onClick={handleCancel} style={{ marginRight: 16 }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditMallInfo;
