"use client";

import {
  CSSProperties,
  ReactElement,
  ReactNode,
  Ref,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type VirtualListHandle = {
  scrollToEnd: (behavior?: ScrollBehavior) => void;
  scrollToOffset: (offset: number, behavior?: ScrollBehavior) => void;
};

type Props<T> = {
  items: T[];
  itemKey: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number | ((item: T, index: number) => number);
  overscan?: number;
  className?: string;
  innerClassName?: string;
  empty?: ReactNode;
};

type MeasuredItemProps = {
  top: number;
  onSize: (height: number) => void;
  children: ReactNode;
};

function MeasuredItem({ top, onSize, children }: MeasuredItemProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const report = () => onSize(el.offsetHeight);
    report();

    const observer = new ResizeObserver(() => report());
    observer.observe(el);

    return () => observer.disconnect();
  }, [onSize]);

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        willChange: "transform,height",
      }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
}

function findIndexByOffset(offsets: number[], value: number) {
  let left = 0;
  let right = offsets.length - 1;

  while (left <= right) {
    const mid = (left + right) >> 1;
    if (offsets[mid] <= value) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return Math.max(0, left - 1);
}

function VirtualListInner<T>(
  {
    items,
    itemKey,
    renderItem,
    estimateSize = 120,
    overscan = 8,
    className = "",
    innerClassName = "",
    empty,
  }: Props<T>,
  ref: Ref<VirtualListHandle>
) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [sizes, setSizes] = useState<Record<number, number>>({});
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const estimate = (item: T, index: number) =>
    typeof estimateSize === "function" ? estimateSize(item, index) : estimateSize;

  const offsets: number[] = new Array(items.length);
  let totalHeight = 0;
  for (let i = 0; i < items.length; i += 1) {
    offsets[i] = totalHeight;
    const measured = sizes[i];
    totalHeight += measured ?? estimate(items[i], i);
  }

  useImperativeHandle(ref, () => ({
    scrollToEnd: (behavior = "auto") => {
      const el = viewportRef.current;
      if (!el) return;
      el.scrollTo({ top: Math.max(0, totalHeight - el.clientHeight), behavior });
    },
    scrollToOffset: (offset, behavior = "auto") => {
      const el = viewportRef.current;
      if (!el) return;
      el.scrollTo({ top: Math.max(0, offset), behavior });
    },
  }), [totalHeight]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => {
      setViewportHeight(el.clientHeight);
      setScrollTop(el.scrollTop);
    };

    update();

    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });

    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const range = (() => {
    if (items.length === 0) return { start: 0, end: -1 };

    const startOffset = Math.max(0, scrollTop);
    const endOffset = scrollTop + Math.max(0, viewportHeight);
    const roughStart = findIndexByOffset(offsets, startOffset);
    const roughEnd = findIndexByOffset(offsets, endOffset);

    return {
      start: Math.max(0, roughStart - overscan),
      end: Math.min(items.length - 1, roughEnd + overscan),
    };
  })();

  const visible = (() => {
    if (range.end < range.start) return [] as number[];
    const arr: number[] = [];
    for (let i = range.start; i <= range.end; i += 1) {
      arr.push(i);
    }
    return arr;
  })();

  const onSize = (index: number, height: number) => {
    setSizes((prev) => {
      const prevHeight = prev[index] || 0;
      if (Math.abs(prevHeight - height) <= 1) {
        return prev;
      }
      return {
        ...prev,
        [index]: height,
      };
    });
  };

  const contentStyle: CSSProperties = {
    height: Math.max(totalHeight, 1),
    position: "relative",
  };

  return (
    <div ref={viewportRef} className={className}>
      {items.length === 0 ? (
        empty || null
      ) : (
        <div style={contentStyle} className={innerClassName}>
          {visible.map((index) => (
            <MeasuredItem key={itemKey(items[index], index)} top={offsets[index]} onSize={(height) => onSize(index, height)}>
              {renderItem(items[index], index)}
            </MeasuredItem>
          ))}
        </div>
      )}
    </div>
  );
}

const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: Props<T> & { ref?: Ref<VirtualListHandle> }
) => ReactElement;

export default VirtualList;
