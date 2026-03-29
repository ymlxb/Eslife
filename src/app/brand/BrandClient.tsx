import Image from "next/image";

import styles from "./brand.module.css";

type BrandItem = {
  name: string;
  image: string;
  intro: string;
  feature: string;
  link: string;
};

type BrandSection = {
  title: string;
  subtitle: string;
  items: BrandItem[];
};

const headerImages = [
  "/legacy/assets/brand1-CHH4wGlA.png",
  "/legacy/assets/brand2-By6w6aYq.png",
  "/legacy/assets/brand3-DEm4ZqC9.png",
];

const brandSections: BrandSection[] = [
  {
    title: "时尚服饰类",
    subtitle: "时尚可持续",
    items: [
      {
        name: "ICICLE 之禾",
        image: "/legacy/assets/icicle-Cip6NNBh.png",
        intro:
          "ICICLE 创立于 1997 年，长期坚持“遵循自然规律”的设计理念，强调天然纤维、长期穿着和高品质工艺，在本土制造与柔性供应链升级方面持续投入。",
        feature:
          "品牌将设计感与实用性结合，注重面料可追溯与耐用性，帮助用户从“快消费”转向“长周期使用”，降低时装浪费与资源压力。",
        link: "https://www.icicle.com.cn/",
      },
      {
        name: "GANNI",
        image: "/legacy/assets/ganni-jrbVjngf.jpg",
        intro:
          "GANNI 来自丹麦，早期为羊绒品牌，后逐步发展为全球化时尚品牌。近年来其核心方向之一是把材料创新和供应链透明度纳入设计流程。",
        feature:
          "通过使用经过认证的有机、再生或低影响材料，探索“更低环境负担”的成衣方案，并持续披露可持续目标进展。",
        link: "https://www.ganni.com/en/home",
      },
    ],
  },
  {
    title: "鞋履领域",
    subtitle: "步履可持续",
    items: [
      {
        name: "Allbirds",
        image: "/legacy/assets/allbirds-CylYEc5h.jpg",
        intro:
          "Allbirds 以舒适与环保并重著称，产品常采用羊毛、桉树纤维等可再生材料，强调日常穿着的轻量体验与材料减碳。",
        feature:
          "品牌在鞋履开发中不断降低石油基原料依赖，并通过碳足迹标识帮助用户更直观看到产品环境影响。",
        link: "https://www.allbirds.cn/pc.html",
      },
      {
        name: "UNTITLAB",
        image: "/legacy/assets/untitlab-BYLI4bxV.jpg",
        intro:
          "UNTITLAB 是国内新锐设计师鞋履品牌，从早期系列起就大面积使用环保超纤面料，把设计表达与可持续理念同步推进。",
        feature:
          "品牌加入“1% for the Planet”等公益行动，持续把商业增长与社会环境责任绑定，推动更长期的绿色消费认知。",
        link: "https://untitlab.com/zh",
      },
    ],
  },
  {
    title: "家居用品领域",
    subtitle: "家居与自然和谐",
    items: [
      {
        name: "IKEA",
        image: "/legacy/assets/ikea-GIy-u61s.jpg",
        intro:
          "IKEA 作为全球家居品牌，在材料端持续提升再生与可再生材料占比，并通过产品标准化设计提高运输和包装效率。",
        feature:
          "其大量使用回收塑料、再生木材等方案，减少原生资源开采压力，同时在照明、收纳、节能产品上提供可落地的家庭实践路径。",
        link: "https://www.ikea.cn/cn/zh/cat/jia-ju-fu001/",
      },
      {
        name: "HOLA",
        image: "/legacy/assets/hola-BbKVZ-Qs.jpg",
        intro:
          "HOLA 专注家居与软装场景，倡导在家居审美之外兼顾原料来源、生产工艺和使用周期，推动“更长久”的消费观。",
        feature:
          "通过可再生原料和更节能的生产方式，逐步降低产品全链路环境影响，帮助用户在生活细节中建立绿色习惯。",
        link: "https://www.hola.com.tw/",
      },
    ],
  },
  {
    title: "美妆护肤类",
    subtitle: "美丽与责任并重",
    items: [
      {
        name: "Aesop",
        image: "/legacy/assets/aesop-DpttWlkI.jpg",
        intro:
          "Aesop 以简洁配方表达和品牌叙事著称，在包装和门店体验中持续强调耐用、可回收与材料克制，减少不必要消耗。",
        feature:
          "其产品设计倾向“少而精”，结合天然来源成分与更稳健的包装策略，鼓励用户形成更理性、可持续的个人护理方式。",
        link: "https://www.aesop.com.cn/",
      },
      {
        name: "Drunk Elephant",
        image: "/legacy/assets/drunk-DDZHAkn3.jpg",
        intro:
          "Drunk Elephant 在配方理念上强调“成分透明”和“减少刺激性组合”，并在包装端不断优化减量与可回收性表现。",
        feature:
          "品牌通过减少多余包装、改进容器结构等方式降低废弃物产生，推动美妆护肤向更低负担方向迭代。",
        link: "https://www.drunkelephant.com/",
      },
    ],
  },
  {
    title: "食品饮料类",
    subtitle: "美味源于自然",
    items: [
      {
        name: "Ben & Jerry’s",
        image: "/legacy/assets/ben-DGU9VMxl.jpg",
        intro:
          "Ben & Jerry’s 在风味创新之外，长期关注公平贸易、原料来源和社区议题，尝试将社会责任纳入品牌运营核心。",
        feature:
          "品牌在包装和供应链上持续探索可循环与低影响路径，兼顾消费者体验与长期环境收益。",
        link: "https://www.benjerry.com/",
      },
      {
        name: "星巴克",
        image: "/legacy/assets/星巴克-BdWHiCLy.jpg",
        intro:
          "星巴克通过咖啡豆可持续采购、门店设备节能改造及绿色运营实践，持续优化从上游到终端的环境管理。",
        feature:
          "在种植端推广更可持续的方法，在门店端推动减塑、节能和循环杯方案，形成覆盖供应链全流程的改进机制。",
        link: "https://www.starbucks.com.cn/",
      },
    ],
  },
];

export default function BrandClient() {
  return (
    <div className={styles.pageWrap}>
      <header className={styles.header}>
        <h1 className={styles.slogan}>探索可持续品牌，开启绿色生活新旅程</h1>
        <div className={styles.heroCarousel}>
          {headerImages.map((src, index) => (
            <div key={src} className={styles.heroSlide} style={{ animationDelay: `${index * 4}s` }}>
              <Image src={src} alt={`brand-header-${index + 1}`} fill className={styles.heroImage} sizes="(max-width: 768px) 100vw, 75vw" />
            </div>
          ))}
        </div>
      </header>

      <section className={styles.sectionWrap}>
        {brandSections.map((section) => (
          <article key={section.title} className={styles.sectionBlock}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <p className={styles.sectionSubTitle}>{section.subtitle}</p>

            <div className={styles.brandGrid}>
              {section.items.map((item) => (
                <div key={item.name} className={styles.brandCard}>
                  <div className={styles.cardOverlay} />
                  <div className={styles.cardContent}>
                    <div className={styles.cardImageWrap}>
                      <Image src={item.image} alt={item.name} fill className={styles.cardImage} sizes="(max-width: 960px) 100vw, 46vw" />
                    </div>
                    <div className={styles.cardDetails}>
                      <h3 className={styles.cardTitle}>{item.name}</h3>
                      <h4 className={styles.cardLabel}>介绍：</h4>
                      <p className={styles.cardText}>{item.intro}</p>
                      <h4 className={styles.cardLabel}>特色：</h4>
                      <p className={styles.cardText}>{item.feature}</p>
                      <a href={item.link} target="_blank" rel="noreferrer" className={styles.moreLink}>
                        了解更多 →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
