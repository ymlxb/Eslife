import Image from "next/image";

import styles from "./guide.module.css";

type GuideItem = {
  title: string;
  image: string;
  content: string[];
};

const guideData: GuideItem[] = [
  {
    title: "家庭烹饪节能",
    image: "/legacy/assets/烹饪节能-ByVhWvFn.jfif",
    content: [
      "电磁炉热效率较高，相较传统燃气灶能更有效利用能源。在烹饪过程中，按照菜品阶段灵活调整火力，避免长时间大火空耗。",
      "提前处理食材（如切配、解冻、腌制），能明显缩短加热时间。配合锅盖与余温利用，可进一步降低每日厨房能耗。",
    ],
  },
  {
    title: "办公场所节能",
    image: "/legacy/assets/办公场所节能-DC6ahx5_.jfif",
    content: [
      "将电脑与显示器设为节能模式，离开工位自动休眠；打印机、复印机、投影等设备在非工作时段统一断电。",
      "尽量利用自然采光并分区控制照明，减少“全开式”照明浪费。结合节能巡检机制，可持续降低办公室综合电耗。",
    ],
  },
  {
    title: "社区节能",
    image: "/legacy/assets/社区节能-pN1xfzVU.jfif",
    content: [
      "鼓励新能源出行并完善公共充电桩、慢充与快充协同布局，减少燃油通勤比例。",
      "通过社区宣讲、积分激励和绿色活动日，提升居民参与节能行动的积极性，形成长期的低碳生活文化。",
    ],
  },
  {
    title: "高效用水",
    image: "/legacy/assets/高效用水-DYHJPpTl.jfif",
    content: [
      "安装节水龙头和淋浴喷头，减少单位时间水流量。收集洗菜水、清洗水用于冲厕或浇灌，提升家庭中水复用率。",
      "定期检查并修复漏水点，缩短淋浴时长，建立“按需取水”习惯，是降低家庭总用水量的关键。",
    ],
  },
  {
    title: "选择环保产品",
    image: "/legacy/assets/选择环保产品-BEmJIVSt.jfif",
    content: [
      "优先购买带有环保认证或能效标识的产品，例如高能效家电、可回收材料日用品和低污染清洁用品。",
      "通过关注产品全生命周期（原料、生产、运输、包装、回收），把一次性消费转化为更长期、可持续的购买决策。",
    ],
  },
  {
    title: "二手和租赁消费类",
    image: "/legacy/assets/ershou-C3zgmPKE.jpg",
    content: [
      "二手家具、二手书籍和租赁电器可大幅延长产品使用寿命。对个人而言降低开支，对社会而言减少新制造带来的资源消耗。",
      "通过可信交易平台与标准化质检流程，二手消费同样可以兼顾质量、价格与使用体验。",
    ],
  },
  {
    title: "家居用品选择",
    image: "/legacy/assets/家居用品选择-BADUg9-M.jfif",
    content: [
      "装修和置家时尽量选用低 VOC 涂料、可持续采伐木材、可再生纤维材料，从源头减少室内污染与资源消耗。",
      "家庭清洁可优先考虑天然配方产品，兼顾清洁效率和环境友好度，减少高刺激化学残留。",
    ],
  },
  {
    title: "减少包装和一次性用品类",
    image: "/legacy/assets/减少包装和一次性用品类jfif-d5wrhfzc.jfif",
    content: [
      "优先购买简包装、可重复补充装的商品，减少多层塑料、泡沫与纸盒包装。",
      "外出携带可重复使用购物袋、水杯、餐具和便当盒，显著减少一次性塑料制品使用频次。",
    ],
  },
  {
    title: "垃圾分类投放",
    image: "/legacy/assets/垃圾分类投放 (1)-0vlf6MkG.jpg",
    content: [
      "建立可回收物、厨余垃圾、有害垃圾和其他垃圾的分类习惯，让垃圾在源头就得到有效分离。",
      "配套清晰标识与投放指引，可减少误投率，提升后续运输与资源化处理效率。",
    ],
  },
  {
    title: "减少垃圾产生",
    image: "/legacy/assets/垃圾分类投放 (2)-BEbqXTtk.jpg",
    content: [
      "倡导简约生活，减少冲动购买和一次性用品依赖，先从“少买、买对、用久”做起。",
      "在家庭和办公场景中推行可重复用品替代策略，能持续压缩日常垃圾增量。",
    ],
  },
  {
    title: "提高垃圾回收利用率",
    image: "/legacy/assets/垃圾分类投放 (3)-DxEYXoFt.jpg",
    content: [
      "完善废纸、塑料、金属、玻璃等回收体系，减少填埋和焚烧压力。",
      "通过社区回收点、智能回收设备和积分兑换机制，提高居民参与度，推动循环利用常态化。",
    ],
  },
  {
    title: "推广垃圾处理新技术",
    image: "/legacy/assets/垃圾分类投放 (4)-CKWRcBRX.jpg",
    content: [
      "探索垃圾焚烧发电、生物降解与填埋气回收等技术，降低污染风险并回收能源。",
      "技术升级应与分类体系协同推进，才能在减量化、资源化和无害化方面取得长期效果。",
    ],
  },
  {
    title: "选择适宜的植物",
    image: "/legacy/assets/家庭绿化 (1)-BLU1aeLb.jpg",
    content: [
      "结合气候、光照、空间和养护能力，优先选择耐阴耐旱、易维护植物，如吊兰、芦荟、绿萝等。",
      "选择本地适生品种可减少养护成本与资源投入，同时提升植物长期存活率。",
    ],
  },
  {
    title: "规划合理的空间布局",
    image: "/legacy/assets/家庭绿化 (2)-DuVhapPq.jpg",
    content: [
      "家庭绿化建议按阳台、窗台、客厅与卧室的功能分区摆放植物，兼顾观赏性和空间通行效率。",
      "预留植物生长空间与采光路径，避免过度密集摆放造成病虫害与维护负担。",
    ],
  },
  {
    title: "实施节水灌溉",
    image: "/legacy/assets/家庭绿化 (3)-Dp20CpMr.jpg",
    content: [
      "采用滴灌、微喷或定时浇灌方式，让水分更精准地进入根系区域，减少蒸发和渗漏。",
      "根据季节变化与植物生长周期动态调整浇水频率，实现“少量多次、按需供水”的绿色养护方式。",
    ],
  },
];

export default function GuideClient() {
  return (
    <div className={styles.pageWrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>绿映未来：诗意栖居，共绘可持续发展蓝图</h1>
      </header>

      <section className={styles.gridWrap}>
        {guideData.map((item) => (
          <article key={item.title} className={styles.guideCard}>
            <div className={styles.imageWrap}>
              <Image src={item.image} alt={item.title} fill className={styles.cardImage} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" />
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              {item.content.map((text) => (
                <details key={text} className={styles.detailItem}>
                  <summary className={styles.summaryText}>展开建议</summary>
                  <p className={styles.cardText}>{text}</p>
                </details>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
