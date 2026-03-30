"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/http";
import styles from "./trade.module.css";

type CommodityItem = {
  id: number;
  name: string;
  detail: string | null;
  tag: string | null;
  imageUrl: string | null;
  price: string;
  seller: { username: string; displayName: string | null };
};

type Props = {
  initialList: CommodityItem[];
  initialTag: string;
  initialQuery: string;
};

const topList = ["数码", "图书音像", "宠物花卉", "美容彩妆", "运动健身"];
const sideCategories = [
  { name: "数码", icon: "💻" },
  { name: "服饰鞋帽", icon: "👟" },
  { name: "汽摩生活", icon: "🚗" },
  { name: "家居生活", icon: "🏠" },
  { name: "图书音像", icon: "📚" },
  { name: "运动健身", icon: "🏆" },
];
const items = ["闲置好物", "数码", "服饰鞋帽", "家具电器", "家居生活", "图书音像", "宠物花卉", "文玩玉翠", "汽摩生活", "运动健身", "美容彩妆", "模玩动漫", "其他"];
const headerImages = [
  "/legacy/assets/home1-ud75RFwV.png",
  "/legacy/assets/home2-Baga0tuv.png",
  "/legacy/assets/home3-DjltnNds.png",
];

function toSearchByTag(tag: string) {
  return `/search?tag=${encodeURIComponent(tag)}`;
}

export default function TradeClient({ initialList, initialTag, initialQuery }: Props) {
  const router = useRouter();

  const [searchText, setSearchText] = useState(initialQuery);
  const [list, setList] = useState<CommodityItem[]>(initialList);
  const [activeTag, setActiveTag] = useState(initialTag || "闲置好物");
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [messageList, setMessageList] = useState<CommodityItem[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % headerImages.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const topHoverLabel = useMemo(() => {
    if (messageList.length === 0) return "暂无推荐商品";
    return "分类推荐";
  }, [messageList.length]);

  const fetchByTag = async (tag: string, onlyPreview = false) => {
    const query = tag === "闲置好物" ? "" : `?tag=${encodeURIComponent(tag)}`;
    const res = await apiRequest<{ code: number; data?: CommodityItem[] }>({
      url: `/api/commodities${query}`,
      method: "GET",
    });
    if (!res.ok || res.data.code !== 0) return;

    const nextList = (res.data.data || []).map((item: CommodityItem) => ({
      ...item,
      price: String(item.price),
    }));

    if (onlyPreview) {
      setMessageList(nextList.slice(0, 6));
      return;
    }

    setActiveTag(tag);
    setList(nextList);
  };

  const onTopHover = (tag: string) => {
    setShowMessageBox(true);
    fetchByTag(tag, true);
  };

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchText.trim()) {
      router.push("/trade");
      return;
    }
    router.push(`/search?name=${encodeURIComponent(searchText.trim())}`);
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.navigation}>
          <div className={styles.navLinks}>
            {topList.map((item) => (
              <div key={item} className={styles.navigationBox} onMouseEnter={() => onTopHover(item)}>
                <button type="button" className={styles.navText} onClick={() => router.push(toSearchByTag(item))}>
                  {item}
                </button>
              </div>
            ))}
          </div>

          <div className={styles.navActions}>
            <form className={styles.search} onSubmit={onSearch}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="笔记本电脑"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <button className={styles.searchBtn}>搜索</button>
            </form>

            <div className={styles.toolbar}>
              <Link href="/mall" className={styles.publishBtn}>
                + 发闲置
              </Link>
            </div>
          </div>
        </div>
      </header>

      {showMessageBox && (
        <div className={styles.messageBox} onMouseLeave={() => setShowMessageBox(false)}>
          <div className={styles.messageTitle}>{topHoverLabel}</div>
          <div className={styles.messageList}>
            {messageList.map((item) => (
              <button key={item.id} className={styles.messageItem} onClick={() => router.push(`/detail/${item.id}`)}>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className={styles.messageImage} />
                ) : (
                  <div className={styles.messageImageEmpty}>暂无图</div>
                )}
                <p className={styles.messageName}>{item.name}</p>
                <p className={styles.messagePrice}>¥{item.price}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <main>
        <section className={styles.contents}>
          <div className={styles.contentsCard}>
            <div className={styles.contentsInner}>
              <div className={styles.contentsItem}>
                {sideCategories.map((item) => (
                  <Link key={item.name} href={toSearchByTag(item.name)} className={styles.contentsItemBox}>
                    <span>{item.icon}</span>
                    <span className={styles.contentsText}>{item.name}</span>
                    <span className={styles.rightArrow}>›</span>
                  </Link>
                ))}
              </div>

              <div className={styles.contentsImages}>
                {headerImages.map((url, index) => (
                  <div key={url} className={`${styles.slide} ${index === slideIndex ? styles.slideActive : ""}`}>
                    <Image src={url} alt={`banner-${index + 1}`} fill className={styles.slideImage} sizes="(max-width: 1024px) 100vw, 70vw" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.show}>
          <div className={styles.showCard}>
            <div className={styles.showItemNav}>
              {items.map((item) => (
                <button
                  key={item}
                  className={`${styles.showItemNavBox} ${activeTag === item || (!activeTag && item === "闲置好物") ? styles.active : ""}`}
                  onClick={() => {
                    if (item === "闲置好物") {
                      router.push("/search");
                      return;
                    }
                    router.push(toSearchByTag(item));
                  }}
                >
                  <span>{item}</span>
                </button>
              ))}
            </div>

            <div className={styles.showItemContain}>
              {list.map((item) => (
                <article className={styles.showItemBox} key={item.id}>
                  <Link href={`/detail/${item.id}`}>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className={styles.showItemImage} />
                    ) : (
                      <div className={styles.showItemImageEmpty}>暂无图片</div>
                    )}
                    <span className={styles.showItemIntro}>{item.detail || item.name}</span>
                    <span className={styles.showItemPrice}>¥{item.price}</span>
                  </Link>
                </article>
              ))}
            </div>

            {list.length === 0 && <div className={styles.empty}>未查询到该商品</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
