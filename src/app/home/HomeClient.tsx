"use client";

import Link from "next/link";
import Image from "next/image";

import styles from "./home.module.css";

type CommodityCard = {
  id: number;
  name: string;
  price: string;
  detail: string | null;
  sellerName: string;
};

type Props = {
  latestList: CommodityCard[];
};

export default function HomeClient({ latestList }: Props) {
  const toTransfer = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.querySelector("#to_transfer")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.contain}>
      <header className={styles.header}>
        <div className={styles.headerTextBox}>
          <h1 className={styles.headingPrimary}>
            <span className={styles.headingPrimaryMain}>持续生活</span>
            <span className={styles.headingPrimarySub}>Sustainable living</span>
          </h1>
          <a href="#" onClick={toTransfer} className={styles.heroBtn}>
            开启我们的旅行
          </a>
        </div>
      </header>

      <main>
        <section className={styles.sectionBrand}>
          <div id="to_transfer" className={styles.centerTitleWrap}>
            <h2 className={styles.headingSecondary}>为喜欢持续生活的人提供可持续的产品品牌</h2>
          </div>

          <div className={styles.twoColRow}>
            <div>
              <h3 className={styles.headingThird}>探索可持续品牌的魅力世界</h3>
              <p className={styles.paragraph}>
                开启您的可持续生活之旅，与我们一起发现那些致力于环保、社会责任和可持续发展的品牌。
              </p>
              <h3 className={styles.headingThird}>加入我们，共创绿色未来</h3>
              <p className={styles.paragraph}>
                在这里，您不仅能找到心仪的可持续产品，还能结识志同道合的伙伴，共同为地球绿色未来贡献力量。
              </p>
              <Link href="/brand" className={styles.readMoreBtn}>
                了解更多
              </Link>
            </div>

            <div className={styles.photoComposition}>
              <Image src="/legacy/assets/brand4-JmDFB83O.png" alt="brand4" width={420} height={280} className={styles.photoP1} />
              <Image src="/legacy/assets/brand5-BwWhM9SS.png" alt="brand5" width={420} height={280} className={styles.photoP2} />
              <Image src="/legacy/assets/brand6-Bwdejh8V.png" alt="brand6" width={420} height={280} className={styles.photoP3} />
            </div>
          </div>
        </section>

        <section className={styles.sectionFeature}>
          <h2 className={styles.headingSecondaryLight}>为喜欢持续生活的人提供可持续的指南</h2>
          <div className={styles.fourColRow}>
            {[
              {
                title: "慢跑捡垃圾",
                frontText: "把日常慢跑与社区清洁结合，边锻炼边捡拾沿途垃圾，让身体健康与城市环境同步受益。",
                backText:
                  "建议准备可重复使用手套和分类垃圾袋，每次 20~30 分钟即可形成稳定习惯。长期坚持能显著减少道路塑料碎片与烟头污染，还能带动身边人共同参与绿色行动。",
              },
              {
                title: "乘坐公共交通",
                frontText: "优先地铁、公交和共享接驳，降低单人通勤碳排放，同时缓解道路拥堵与停车压力。",
                backText:
                  "可通过提前规划路线与错峰出行提升效率。对比私家车短途通勤，公共交通单位人公里排放更低；每周固定 3~5 天绿色通勤，全年就能减少可观的燃油消耗与尾气排放。",
              },
              {
                title: "使用节能电器",
                frontText: "选择高能效家电并合理设置运行模式，在不牺牲体验的前提下持续降低家庭电耗。",
                backText:
                  "例如空调保持 26°C 左右、冰箱避免频繁开关、洗衣机满桶再洗，并搭配峰谷用电策略。通过设备升级与使用习惯优化的组合，通常可在一个季度内看到电费与能耗的明显下降。",
              },
              {
                title: "避免食物浪费",
                frontText: "从采购清单、分量控制到剩食再利用，建立更精细的家庭饮食管理方式。",
                backText:
                  "可按“一周菜单+分批采购”减少冲动消费，把临期食材优先处理并冷冻分装，剩菜改造成便当或汤底。这样既能降低厨余垃圾处理压力，也能节省家庭开支并减少食物全链路的资源浪费。",
              },
            ].map((item, index) => (
              <article key={item.title} className={styles.featureBox} style={{ animationDelay: `${index * 0.18}s` }}>
                <div className={styles.featureFlipInner}>
                  <div className={`${styles.featureFace} ${styles.featureFront}`}>
                    <div className={styles.featureIcon}>🌿</div>
                    <h3 className={styles.headingThird}>{item.title}</h3>
                    <p className={styles.featureText}>{item.frontText}</p>
                  </div>
                  <div className={`${styles.featureFace} ${styles.featureBack}`}>
                    <h3 className={styles.headingThird}>{item.title}</h3>
                    <p className={styles.featureText}>{item.backText}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.sectionTours}>
          <div className={styles.centerTitleWrap}>
            <h2 className={styles.headingSecondary}>为喜欢持续生活的人提供持续的生活方式</h2>
          </div>

          <div className={styles.cardsRow}>
            <article className={styles.flipCard}>
              <div className={styles.flipCardInner}>
                <div className={`${styles.flipSide} ${styles.flipFront}`}>
                  <div className={`${styles.cardPicture} ${styles.cardPicture1}`} />
                  <h3 className={styles.cardHeading}>二手交易平台</h3>
                  <p className={styles.cardText}>闲置不浪费，延续物品价值，绿色持续生活从这里开始。</p>
                </div>
                <div className={`${styles.flipSide} ${styles.flipBack}`}>
                  <h3 className={styles.headingThird}>功能与作用</h3>
                  <p className={styles.paragraph}>为闲置物品提供再流通渠道，延长使用寿命、减少资源浪费。</p>
                  <h3 className={styles.headingThird}>可持续贡献</h3>
                  <p className={styles.paragraph}>减少新生产带来的资源消耗与污染，促进社区共享文化。</p>
                </div>
              </div>
            </article>

            <article className={styles.flipCard}>
              <div className={styles.flipCardInner}>
                <div className={`${styles.flipSide} ${styles.flipFront}`}>
                  <div className={`${styles.cardPicture} ${styles.cardPicture2}`} />
                  <h3 className={styles.cardHeading}>可持续品牌</h3>
                  <p className={styles.cardText}>以消费践行环保与社会责任，推动绿色供应链和产品创新。</p>
                </div>
                <div className={`${styles.flipSide} ${styles.flipBack}`}>
                  <h3 className={styles.headingThird}>功能与作用</h3>
                  <p className={styles.paragraph}>在时尚、家居、食品等领域推广低影响材料和节能工艺。</p>
                  <h3 className={styles.headingThird}>可持续贡献</h3>
                  <p className={styles.paragraph}>降低原始资源开采压力，帮助建立长期循环利用体系。</p>
                </div>
              </div>
            </article>

            <article className={styles.flipCard}>
              <div className={styles.flipCardInner}>
                <div className={`${styles.flipSide} ${styles.flipFront}`}>
                  <div className={`${styles.cardPicture} ${styles.cardPicture3}`} />
                  <h3 className={styles.cardHeading}>绿色生活指南</h3>
                  <p className={styles.cardText}>覆盖家庭、出行、消费多场景，帮助快速落地低碳行动。</p>
                </div>
                <div className={`${styles.flipSide} ${styles.flipBack}`}>
                  <h3 className={styles.headingThird}>功能与作用</h3>
                  <p className={styles.paragraph}>指导节能、节水、垃圾分类和绿色消费的具体做法。</p>
                  <h3 className={styles.headingThird}>可持续贡献</h3>
                  <p className={styles.paragraph}>减少污染与浪费，长期改善生态环境和社区生活质量。</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.sectionLatest}>
          <div className={styles.centerTitleWrap}>
            <h2 className={styles.headingSecondary}>最新二手商品</h2>
          </div>
          <div className={styles.cardsRow}>
            {latestList.length === 0 ? (
              <div className={styles.emptyCard}>暂无商品，去交易页发布第一件商品。</div>
            ) : (
              latestList.map((item) => (
                <article key={item.id} className={styles.productCard}>
                  <Link href={`/detail/${item.id}`} className={styles.productTitle}>
                    {item.name}
                  </Link>
                  <p className={styles.productPrice}>¥{item.price}</p>
                  <p className={styles.productDesc}>{item.detail || "暂无描述"}</p>
                  <p className={styles.productSeller}>卖家：{item.sellerName}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
