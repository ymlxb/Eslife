import React from 'react';
import { Carousel, Divider } from 'antd';
import './Brand.less';

import icicle from '../assets/images/icicle.png';
import ganni from '../assets/images/ganni.jpg';
import allbirds from '../assets/images/allbirds.jpg';
import untitlab from '../assets/images/untitlab.jpg';
import ikea from '../assets/images/ikea.jpg';
import hola from '../assets/images/hola.jpg';
import aesop from '../assets/images/aesop.jpg';
import drunk from '../assets/images/drunk.jpg';
import ben from '../assets/images/ben.jpg';
import starbucks from '../assets/images/星巴克.jpg';
import brand1 from '../assets/images/brand1.png';
import brand2 from '../assets/images/brand2.png';
import brand3 from '../assets/images/brand3.png';

const Brand: React.FC = () => {
  const headerImages = [
    { url: brand1 },
    { url: brand2 },
    { url: brand3 },
  ];

  return (
    <div className="brand-contain">
      <header className="header">
        <div className="slogan">探索可持续品牌，开启绿色生活新旅程</div>
        <Carousel autoplay className="carousel-container" effect="fade">
          {headerImages.map((item, index) => (
            <div key={index}>
              <img src={item.url} className="head-img" alt={`brand-${index}`} />
            </div>
          ))}
        </Carousel>
      </header>
      <main>
        <section className="show">
          <div className="show-box">
            <h3 className="show-box-title">时尚服饰类</h3>
            <Divider orientation="left" style={{ marginBottom: '4rem' }} />
            <div className="show-box-title-second">时尚可持续</div>
            <div className="show-box-item">
              <div className="show-box-item--1">
                <div>
                  <div className="show-box-brg"></div>
                  <div className="show-box-content">
                    <div className="show-box-item-img">
                      <img src={icicle} alt="icicle" className="show-box-item-img-one" />
                    </div>
                    <div className="show-box-item-details">
                      <h3 className="title-second u-margin-button-2">介绍:</h3>
                      <p className="paragraph">
                        icicle 之禾创立于 1997 年，以 “遵循自然原则和规律”
                        为理念。深入本土制造产业升级，为高端时装业柔性制造提供可能。
                      </p>
                      <h3 className="title-second u-margin-button-2">特色:</h3>
                      <p className="paragraph">
                        始终坚持使用天然材质，将产品质量与设计感完美融合。在制造环节，以高标准严控瑕疵数量，致力于为消费者打造高品质时尚之选。
                      </p>
                      <a href="https://www.icicle.com.cn/" target="_blank" rel="noreferrer" className="btn-text">了解更多 &rarr;</a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="show-box-item--1">
                <div className="show-box-brg"></div>
                <div className="show-box-content">
                  <div className="show-box-item-img">
                    <img src={ganni} alt="ganni" className="show-box-item-img-one" />
                  </div>
                  <div className="show-box-item-details">
                    <h3 className="title-second u-margin-button-2">介绍:</h3>
                    <p className="paragraph">
                      Ganni来自丹麦的时尚品牌，2000 年由画廊主 Fran Struelsen
                      创立，最初是羊绒品牌，后在 2009 年 Ditte 和 Nicolaj
                      Reffstrup 夫妇接手后风格转变。
                    </p>
                    <h3 className="title-second u-margin-button-2">特色:</h3>
                    <p className="paragraph">
                      在追求时尚的同时，积极探索可持续发展道路，
                      经过认证的有机、可循环或低影响材料制作成衣系列，减少了对环境的影响。
                    </p>
                    <a href="https://www.ganni.com/en/home" target="_blank" rel="noreferrer" className="btn-text">了解更多 &rarr;</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="show-box">
            <h3 className="show-box-title">鞋履领域</h3>
            <Divider orientation="left" style={{ marginBottom: '4rem' }} />
            <div className="show-box-title-second">步履可持续</div>
            <div className="show-box-item">
              <div className="show-box-item--1">
                <div className="show-box-brg"></div>
                <div className="show-box-content">
                  <div className="show-box-item-img">
                    <img src={allbirds} alt="allbirds" className="show-box-item-img-one" />
                  </div>
                  <div className="show-box-item-details">
                    <h3 className="title-second u-margin-button-2">介绍:</h3>
                    <p className="paragraph">
                      Allbirds来自新西兰的鞋履品牌，以舒适且环保的鞋履产品受到消费者的青睐。其产品不仅在新西兰本土市场销售，还远销全球多个国家和地区。
                    </p>
                    <h3 className="title-second u-margin-button-2">特色:</h3>
                    <p className="paragraph">
                      鞋面材料常采用天然羊毛、桉树纤维等可再生资源，同时也减少了对传统石油基材料的依赖。
                    </p>
                    <a href="https://www.allbirds.cn/pc.html" target="_blank" rel="noreferrer" className="btn-text">了解更多 &rarr;</a>
                  </div>
                </div>
              </div>
              <div className="show-box-item--1">
                <div className="show-box-brg"></div>
                <div className="show-box-content">
                  <div className="show-box-item-img">
                    <img src={untitlab} alt="untitlab" className="show-box-item-img-one" />
                  </div>
                  <div className="show-box-item-details">
                    <h3 className="title-second u-margin-button-2">介绍:</h3>
                    <p className="paragraph">
                      untitlab
                      是中国新锐设计师鞋履品牌，从品牌创立之初便坚持使用环保材料，从第一季起，全部系列都使用环保超纤面料，践行环保理念、践行可持续理念。
                    </p>
                    <h3 className="title-second u-margin-button-2">特色:</h3>
                    <p className="paragraph">
                      从品牌创立伊始就始终坚持使用环保材料，并且加入 “1% for the
                      Planet”
                      全球组织，积极履行环保社会责任，为地球可持续发展贡献力量。
                    </p>
                    <a href="https://untitlab.com/zh" target="_blank" rel="noreferrer" className="btn-text">了解更多 &rarr;</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="show-box">
            <h3 className="show-box-title">家居用品领域</h3>
            <Divider orientation="left" style={{ marginBottom: '4rem' }} />
            <div className="show-box-title-second">家居与自然和谐</div>
            <div className="show-box-item">
              <div className="show-box-item--1">
                <div className="show-box-brg"></div>
                <div className="show-box-content">
                  <div className="show-box-item-img">
                    <img src={ikea} alt="ikea" className="show-box-item-img-one" />
                  </div>
                  <div className="show-box-item-details">
                    <h3 className="title-second u-margin-button-2">介绍:</h3>
                    <p className="paragraph">
                      IKEA（宜家）于 1943
                      年在瑞典创立，经过多年发展，宜家已成为全球最大的家具家居用品企业。
                    </p>
                    <h3 className="title-second u-margin-button-2">特色:</h3>
                    <p className="paragraph">
                      推出大量使用回收塑料、再生木材等环保材料的家居产品。例如，用回收塑料瓶制成的地毯，不仅减少了塑料废弃物的污染，还为家居产品提供了新的材料来源。
                    </p>
                    <a href="https://www.ikea.cn/cn/zh/cat/jia-ju-fu001/" target="_blank" rel="noreferrer" className="btn-text">了解更多 &rarr;</a>
                  </div>
                </div>
              </div>
              <div className="show-box-item--1">
                <div className="show-box-brg"></div>
                <div className="show-box-content">
                  <div className="show-box-item-img">
                    <img src={hola} alt="hola" className="show-box-item-img-one" />
                  </div>
                  <div className="show-box-item-details">
                    <h3 className="title-second u-margin-button-2">介绍:</h3>
                    <p className="paragraph">
                      HOLA
                      是一家致力于提供家居用品和家居装饰的品牌，起源于中国，近年来在全球市场上逐渐扩展。
                    </p>
                    <h3 className="title-second u-margin-button-2">特色:</h3>
                    <p className="paragraph">
                      HOLA
                      积极倡导使用可再生、可回收的原料，并且采取节能环保的生产工艺，以此减少对环境的影响，全力打造更环保的家居产品。
                    </p>
                    <a href="https://www.hola.com.tw/" target="_blank" rel="noreferrer" className="btn-text">了解更多 &rarr;</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="show-box">
            <h3 className="show-box-title">美妆护肤类</h3>
            <Divider orientation="left" style={{ marginBottom: '4rem' }} />
            <div className="show-box-title-second">美丽与责任并重</div>
            <div className="show-box-item">
              <div className="show-box-item--1">
                <div className="show-box-brg"></div>
                <div className="show-box-content">
                  <div className="show-box-item-img">
                    <img src={aesop} alt="aesop" className="show-box-item-img-one" />
                  </div>
                  <div className="show-box-item-details">
                    <h3 className="title-second u-margin-button-2">介绍:</h3>
                    <p className="paragraph">
                      Aesop（伊索）
                      是在美妆护肤界颇具知名度且深受消费者喜爱的品牌，以其独特的品牌理念和产品特色在市场中占据一席之地。
                    </p>
                    <h3 className="title-second u-margin-button-2">特色:</h3>
                    <p className="paragraph">
                      简约包装，精心选取天然、纯净的成分，包装材料也精挑细选，它们不仅契合简约美学追求，更与品牌天然、质朴理念相呼应。
                    </p>
                    <a href="https://www.aesop.com.cn/" target="_blank" rel="noreferrer" className="btn-text">了解更多 &rarr;</a>
                  </div>
                </div>
              </div>
              <div className="show-box-item--1">
                <div className="show-box-brg"></div>
                <div className="show-box-content">
                  <div className="show-box-item-img">
                    <img src={drunk} alt="drunk" className="show-box-item-img-one" />
                  </div>
                  <div className="show-box-item-details">
                    <h3 className="title-second u-margin-button-2">介绍:</h3>
                    <p className="paragraph">
                      Drunk
                      Elephant（醉象）是美妆护肤领域中备受关注的品牌，以其独特的成分理念和对包装的优化举措而闻名。
                    </p>
                    <h3 className="title-second u-margin-button-2">特色:</h3>
                    <p className="paragraph">
                      Drunk Elephant 强调用 “干净”
                      成分，这是品牌理念核心，其在包装上也努力减少垃圾产生。
                    </p>
                    <a href="https://www.drunkelephant.com/" target="_blank" rel="noreferrer" className="btn-text">了解更多 &rarr;</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="show-box">
            <h3 className="show-box-title">食品饮料类</h3>
            <Divider orientation="left" style={{ marginBottom: '4rem' }} />
            <div className="show-box-title-second">美味源于自然</div>
            <div className="show-box-item">
              <div className="show-box-item--1">
                <div className="show-box-brg"></div>
                <div className="show-box-content">
                  <div className="show-box-item-img">
                    <img src={ben} alt="ben" className="show-box-item-img-one" />
                  </div>
                  <div className="show-box-item-details">
                    <h3 className="title-second u-margin-button-2">介绍:</h3>
                    <p className="paragraph">
                      Ben & Jerry’s
                      是全球知名冰淇淋品牌，口味多样、理念独特，积极践行社会责任和环保，受消费者喜爱。
                    </p>
                    <h3 className="title-second u-margin-button-2">特色:</h3>
                    <p className="paragraph">
                      在原料采购环节秉持公平贸易的理念，这是其品牌的一大特色。品牌不仅仅满足于使用现有的可回收材料，还不断探索新的包装形式以提高可回收性。
                    </p>
                    <a href="https://www.benjerry.com/" target="_blank" rel="noreferrer" className="btn-text">了解更多 &rarr;</a>
                  </div>
                </div>
              </div>
              <div className="show-box-item--1">
                <div className="show-box-brg"></div>
                <div className="show-box-content">
                  <div className="show-box-item-img">
                    <img src={starbucks} alt="starbucks" className="show-box-item-img-one" />
                  </div>
                  <div className="show-box-item-details">
                    <h3 className="title-second u-margin-button-2">介绍:</h3>
                    <p className="paragraph">
                      星巴克作为全球知名的咖啡连锁品牌，在从原料采购到门店运营的各个环节的可持续发展方面做出了诸多努力。
                    </p>
                    <h3 className="title-second u-margin-button-2">特色:</h3>
                    <p className="paragraph">
                      向全球的咖啡农推广可持续的种植方法，从源头上保障了产品的可持续性，星巴克还在整体运营环节进行了节能优化，在店内广泛采用节能设备。
                    </p>
                    <a href="https://www.starbucks.com.cn/" target="_blank" rel="noreferrer" className="btn-text">了解更多 &rarr;</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Brand;
