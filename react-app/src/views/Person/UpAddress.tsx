import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Modal, Card, Typography, Divider, message, Row, Col } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { getAllUserAddress, addUserAddress } from '../../api/api';
import './UpAddress.less';

const { Title, Text } = Typography;
const { Option } = Select;

interface Address {
  id?: string;
  addressee: string;
  mobile: string;
  province: string;
  city: string;
  fullAddress: string;
}

const provinces = [
  { value: "北京", label: "北京" },
  { value: "天津", label: "天津" },
  { value: "河北", label: "河北" },
  { value: "山西", label: "山西" },
  { value: "内蒙古", label: "内蒙古" },
  { value: "辽宁", label: "辽宁" },
  { value: "吉林", label: "吉林" },
  { value: "黑龙江", label: "黑龙江" },
  { value: "上海", label: "上海" },
  { value: "江苏", label: "江苏" },
  { value: "浙江", label: "浙江" },
  { value: "安徽", label: "安徽" },
  { value: "福建", label: "福建" },
  { value: "江西", label: "江西" },
  { value: "山东", label: "山东" },
  { value: "河南", label: "河南" },
  { value: "湖北", label: "湖北" },
  { value: "湖南", label: "湖南" },
  { value: "广东", label: "广东" },
  { value: "广西", label: "广西" },
  { value: "海南", label: "海南" },
  { value: "重庆", label: "重庆" },
  { value: "四川", label: "四川" },
  { value: "贵州", label: "贵州" },
  { value: "云南", label: "云南" },
  { value: "西藏", label: "西藏" },
  { value: "陕西", label: "陕西" },
  { value: "甘肃", label: "甘肃" },
  { value: "青海", label: "青海" },
  { value: "宁夏", label: "宁夏" },
  { value: "新疆", label: "新疆" },
  { value: "香港", label: "香港" },
  { value: "澳门", label: "澳门" },
  { value: "台湾", label: "台湾" }
];

const UpAddress: React.FC = () => {
  const [addressList, setAddressList] = useState<Address[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchAddresses = async () => {
    try {
      const res = await getAllUserAddress();
      if (res.code === 0) {
        setAddressList(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch addresses", error);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAdd = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const res = await addUserAddress(values);
      if (res.code === 0) {
        message.success('添加成功');
        setIsModalVisible(false);
        fetchAddresses();
      } else {
        message.error(res.message || '添加失败');
      }
    } catch (error) {
      console.error("Submit error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="up-address-container">
      <div className="header">
        <Title level={4}>收货地址</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增
        </Button>
      </div>
      <Divider />
      
      <div className="address-list">
        {addressList.map((address, index) => (
          <Card 
            key={index} 
            className="address-card"
            title={`${address.addressee} ${address.province}`}
            extra={<CloseOutlined style={{ cursor: 'pointer' }} />}
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Text type="secondary">收货人：</Text> {address.addressee}
              </Col>
              <Col span={24}>
                <Text type="secondary">所在地区：</Text> {address.province} {address.city}
              </Col>
              <Col span={24}>
                <Text type="secondary">地址：</Text> {address.fullAddress}
              </Col>
              <Col span={24}>
                <Text type="secondary">手机：</Text> {address.mobile}
              </Col>
            </Row>
          </Card>
        ))}
        {addressList.length === 0 && <div style={{ textAlign: 'center', padding: '2rem' }}>暂无地址</div>}
      </div>

      <Modal
        title="新增收货地址"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="addressee"
            label="收件人"
            rules={[{ required: true, message: '请输入收件人' }]}
          >
            <Input placeholder="请输入收件人" />
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
            name="province"
            label="省份"
            rules={[{ required: true, message: '请选择省份' }]}
          >
            <Select placeholder="请选择省份">
              {provinces.map(p => (
                <Option key={p.value} value={p.value}>{p.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="city"
            label="城市"
            rules={[{ required: true, message: '请输入城市' }]}
          >
            <Input placeholder="请输入城市" />
          </Form.Item>

          <Form.Item
            name="fullAddress"
            label="详细地址"
            rules={[{ required: true, message: '请输入详细地址' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入详细地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UpAddress;
