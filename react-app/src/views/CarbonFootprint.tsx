import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Collapse, InputNumber, Select, Button, List, Statistic, Row, Col, Tag, Typography, message } from 'antd';
import { ThunderboltOutlined, CarOutlined, SaveOutlined, CaretRightOutlined, HomeOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import './CarbonFootprint.less';

const { Panel } = Collapse;
const { Title, Text } = Typography;
const { Option } = Select;

interface EnergyData {
  electricity: number;
  gas: number;
}

interface TransportData {
  mileage: number;
  vehicleType: 'car' | 'ev' | 'public';
}

interface HistoryRecord {
  date: string;
  value: string;
}

const CarbonFootprint: React.FC = () => {
  const [energy, setEnergy] = useState<EnergyData>({ electricity: 0, gas: 0 });
  const [transport, setTransport] = useState<TransportData>({ mileage: 0, vehicleType: 'car' });
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Emission factors
  const emissionFactors = {
    energy: {
      electricity: 0.5,
      gas: 1.9
    },
    transport: {
      car: 0.12,
      ev: 0.05,
      public: 0.08
    }
  };

  // Load history
  useEffect(() => {
    const savedHistory = localStorage.getItem('carbonHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Calculate total emissions
  const totalEmissions = useMemo(() => {
    return (
      energy.electricity * emissionFactors.energy.electricity +
      energy.gas * emissionFactors.energy.gas +
      transport.mileage * emissionFactors.transport[transport.vehicleType]
    );
  }, [energy, transport]);

  // Chart initialization and update
  useEffect(() => {
    if (chartRef.current) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }

      const option = {
        tooltip: { trigger: 'item' },
        legend: { top: 'bottom' },
        series: [{
          name: '碳排放组成',
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { 
              value: energy.electricity * emissionFactors.energy.electricity,
              name: '电力排放',
              itemStyle: { color: '#5470C6' }
            },
            { 
              value: energy.gas * emissionFactors.energy.gas,
              name: '燃气排放',
              itemStyle: { color: '#91CC75' }
            },
            { 
              value: transport.mileage * emissionFactors.transport[transport.vehicleType],
              name: '交通排放',
              itemStyle: { color: '#FAC858' }
            }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };
      chartInstance.current.setOption(option);
    }

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // Don't dispose here to avoid flickering or re-init issues in strict mode, 
      // or dispose if we want clean up.
      // chartInstance.current?.dispose(); 
    };
  }, [energy, transport]);

  const saveRecord = () => {
    const newRecord = {
      date: new Date().toLocaleDateString(),
      value: totalEmissions.toFixed(2)
    };
    const newHistory = [newRecord, ...history].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('carbonHistory', JSON.stringify(newHistory));
    message.success('记录已保存');
  };

  // Recommendations logic
  const recommendationConfig = [
    {
      condition: () => energy.electricity > 300,
      category: 'energy',
      title: '高电力消耗',
      description: '您每月用电量较高，建议：1.更换LED节能灯 2.使用一级能效电器',
      reduction: 45,
      impact: 3, 
      difficulty: 2,
      tags: ['节能', '电器']
    },
    {
      condition: () => transport.vehicleType === 'car' && transport.mileage > 500,
      category: 'transport',
      title: '燃油车高频使用',
      description: '考虑每周2天使用公共交通或拼车出行，可有效降低排放',
      reduction: 28,
      impact: 2,
      difficulty: 3,
      tags: ['交通', '共享出行']
    },
  ];

  const activeRecommendations = useMemo(() => {
    return recommendationConfig
      .filter(r => r.condition())
      .sort((a, b) => b.impact - a.impact);
  }, [energy, transport]);

  return (
    <div className="carbon-footprint-container">
      <Card title={<Title level={2}>碳足迹计算器</Title>} className="main-card">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Collapse defaultActiveKey={['energy', 'transport']} expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}>
              <Panel header={<span><HomeOutlined /> 家庭能源</span>} key="energy">
                <div className="input-group">
                  <div className="input-item">
                    <label>电力 (kWh/月):</label>
                    <InputNumber 
                      min={0} 
                      value={energy.electricity} 
                      onChange={(val) => setEnergy({ ...energy, electricity: val || 0 })} 
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="input-item">
                    <label>天然气 (m³/月):</label>
                    <InputNumber 
                      min={0} 
                      value={energy.gas} 
                      onChange={(val) => setEnergy({ ...energy, gas: val || 0 })} 
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </Panel>
              <Panel header={<span><CarOutlined /> 交通出行</span>} key="transport">
                <div className="input-group">
                  <div className="input-item">
                    <label>里程 (km/月):</label>
                    <InputNumber 
                      min={0} 
                      value={transport.mileage} 
                      onChange={(val) => setTransport({ ...transport, mileage: val || 0 })} 
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="input-item">
                    <label>交通工具:</label>
                    <Select 
                      value={transport.vehicleType} 
                      onChange={(val) => setTransport({ ...transport, vehicleType: val })}
                      style={{ width: '100%' }}
                    >
                      <Option value="car">汽油车</Option>
                      <Option value="ev">电动车</Option>
                      <Option value="public">公共交通</Option>
                    </Select>
                  </div>
                </div>
              </Panel>
            </Collapse>

            {activeRecommendations.length > 0 && (
              <Card title="优化建议" className="recommendations-card" size="small" style={{ marginTop: 20 }}>
                <List
                  itemLayout="horizontal"
                  dataSource={activeRecommendations}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<ThunderboltOutlined style={{ color: '#faad14', fontSize: 24 }} />}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.title}</span>
                            <div>
                              {item.tags.map(tag => <Tag key={tag} color="blue">{tag}</Tag>)}
                            </div>
                          </div>
                        }
                        description={item.description}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </Col>
          
          <Col xs={24} md={12}>
            <div ref={chartRef} className="chart-container" style={{ height: 400 }}></div>
            
            <Card className="result-section">
              <div className="total-emissions">
                <Statistic 
                  title="月度碳排放" 
                  value={totalEmissions} 
                  precision={2} 
                  suffix="kgCO₂" 
                  valueStyle={{ color: '#3f8600' }}
                />
                <Button type="primary" icon={<SaveOutlined />} onClick={saveRecord}>
                  保存记录
                </Button>
              </div>
              
              <div className="history-section" style={{ marginTop: 20 }}>
                <Title level={5}>历史记录 (最近5次)</Title>
                <List
                  size="small"
                  bordered
                  dataSource={history}
                  renderItem={(item, index) => (
                    <List.Item>
                      <Text strong>#{index + 1}</Text> {item.date} <CaretRightOutlined /> {item.value} kg
                    </List.Item>
                  )}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default CarbonFootprint;
