import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import './Guide.less';

// Import images
import imgCooking from '../assets/images/烹饪节能.jfif';
import imgOffice from '../assets/images/办公场所节能.jfif';
import imgCommunity from '../assets/images/社区节能.jfif';
import imgWater from '../assets/images/高效用水.jfif';
import imgProduct from '../assets/images/选择环保产品.jfif';
import imgErshou from '../assets/images/ershou.jpg';
import imgHome from '../assets/images/家居用品选择.jfif';
import imgPackage from '../assets/images/减少包装和一次性用品类jfif.jfif';
import imgGarbage1 from '../assets/images/垃圾分类投放 (1).jpg';
import imgGarbage2 from '../assets/images/垃圾分类投放 (2).jpg';
import imgGarbage3 from '../assets/images/垃圾分类投放 (3).jpg';
import imgGarbage4 from '../assets/images/垃圾分类投放 (4).jpg';
import imgGreen1 from '../assets/images/家庭绿化 (1).jpg';
import imgGreen2 from '../assets/images/家庭绿化 (2).jpg';
import imgGreen3 from '../assets/images/家庭绿化 (3).jpg';

const { Paragraph } = Typography;

const guideData = [
  {
    title: '家庭烹饪节能',
    img: imgCooking,
    content: [
      '电磁炉的热效率也比较高，相比传统的燃气灶能更有效地利用能源。在烹饪过程中，根据不同的菜品和烹饪阶段调整火候大小。',
      '提前将食材切好、解冻等，这样可以减少烹饪时间，降低能源消耗。'
    ]
  },
  {
    title: '办公场所节能',
    img: imgOffice,
    content: [
      '将电脑的电源管理设置为节能模式，在一段时间不使用时自动进入休眠状态。合理安排办公区域的照明，充分利用自然光，减少人工照明的使用。打印机、复印机、笔记本等设备在不使用时及时关闭电源。'
    ]
  },
  {
    title: '社区节能',
    img: imgCommunity,
    content: [
      '鼓励居民使用新能源汽车，建设公共充电桩，方便居民充电，减少传统燃油汽车的使用。',
      '在社区内举办节能宣传活动，提高居民的节能意识，鼓励居民共同参与节能行动。'
    ]
  },
  {
    title: '高效用水',
    img: imgWater,
    content: [
      '安装节水龙头和淋浴喷头，减少水的流量。收集废水用于浇花、冲洗厕所等非饮用水用途。',
      '缩短淋浴时间，避免长时间泡澡。检查和修复漏水的水龙头和管道，防止水资源浪费。'
    ]
  },
  {
    title: '选择环保产品',
    img: imgProduct,
    content: [
      '购买带有环保标志的产品，如能源之星认证的电器、可回收材料制成的日用品等。',
      '选择有机食品和农产品，减少农药和化肥的使用。拒绝过度包装的商品，选择简单包装或无包装的产品。'
    ]
  },
  {
    title: '二手和租赁消费类',
    img: imgErshou,
    content: [
      '选购二手家具与书籍。二手家具市场有各种各样的产品，从古典风格的实木桌椅到现代简约的沙发等。购买二手家具不仅可以节省开支，还能赋予旧家具新的生命。二手书籍价格通常比新书便宜很多，更具性价比。'
    ]
  },
  {
    title: '家居用品选择',
    img: imgHome,
    content: [
      '选用绿色建材。在装修房屋时，选择具有环保标识的建筑材料，如低挥发性有机化合物（VOC）的涂料、可持续采伐的木材等。',
      '购买环保型清洁用品,环保清洁用品通常采用天然成分。'
    ]
  },
  {
    title: '减少包装和一次性用品类',
    img: imgPackage,
    content: [
      '购买包装简单的产品。尽量避免过度包装的商品，特别是那些有多层塑料、纸盒、泡沫等包装的产品。',
      '减少一次性塑料制品的使用。携带可重复使用的购物袋、水杯、餐具等，减少包装的浪费。'
    ]
  },
  {
    title: '垃圾分类投放',
    img: imgGarbage1,
    content: [
      '建立和完善垃圾分类制度，鼓励居民将垃圾分为可回收物、厨余垃圾、有害垃圾和其他垃圾。',
      '通过教育和宣传，提高公众的垃圾分类意识，使垃圾在源头得到有效分离，便于后续处理和资源化利用。'
    ]
  },
  {
    title: '减少垃圾产生',
    img: imgGarbage2,
    content: [
      '倡导简约生活，减少一次性产品和过度包装的使用，减少垃圾的产生，充实我们的生活。',
      '鼓励消费者选择可重复使用或可降解的产品，如使用布袋代替塑料袋，选择简包装的商品，以减少垃圾的产生。'
    ]
  },
  {
    title: '提高垃圾回收利用率',
    img: imgGarbage3,
    content: [
      '加强回收体系建设，提高废纸、塑料、金属、玻璃等可回收物的回收率，减少垃圾填埋和焚烧的次数。',
      '通过建立回收站点、推广智能回收设备等方式，方便居民参与回收活动，促进资源的循环利用。'
    ]
  },
  {
    title: '推广垃圾处理新技术',
    img: imgGarbage4,
    content: [
      '研究和应用先进的垃圾处理技术，如垃圾焚烧发电、生物降解、垃圾填埋气发电等。',
      '这些技术可以减少垃圾体积，降低环境污染，同时实现能源的回收利用，提高资源的利用效率。'
    ]
  },
  {
    title: '选择适宜的植物',
    img: imgGreen1,
    content: [
      '根据家庭所在地的气候条件、土壤类型和室内外环境，选择适合生长的植物，如绿萝、仙人掌、盆栽等。',
      '可以选择一些耐阴、耐旱、易养护的植物，如吊兰、芦荟等，这些植物既能美化环境，又能净化空气。'
    ]
  },
  {
    title: '规划合理的空间布局',
    img: imgGreen2,
    content: [
      '家庭绿化要考虑空间利用，合理规划植物摆放位置。',
      '可以在阳台、窗台、客厅、卧室等地方摆放植物，既不占用过多空间，又能起到装饰作用。同时，要注意植物的生长空间，避免过于拥挤。'
    ]
  },
  {
    title: '实施节水灌溉',
    img: imgGreen3,
    content: [
      '家庭绿化应采用节水灌溉方式，如滴灌、微喷等，减少水资源浪费，提高水资源利用效率。',
      '浇水时，要依据植物的品种特性和生长周期等因素，在适当时机适量浇水，以免对植物的生长和发育产生不良影响。'
    ]
  }
];

const Guide: React.FC = () => {
  return (
    <div className="guide-page">
      <div className="header">
        <h1 className="animate-title">
          绿映未来：诗意栖居，共绘可持续发展蓝图
        </h1>
      </div>
      
      <div className="content-wrap">
        <Row gutter={[24, 24]}>
          {guideData.map((item, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <Card 
                hoverable
                cover={<img alt={item.title} src={item.img} style={{ height: 200, objectFit: 'cover' }} />}
                className="guide-card"
              >
                <Card.Meta 
                  title={item.title}
                  description={
                    <div>
                      {item.content.map((text, i) => (
                        <Paragraph key={i} ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}>
                          {text}
                        </Paragraph>
                      ))}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Guide;
