import styles from "./PlantLoading.module.css";

type Props = {
  text?: string;
  compact?: boolean;
  fullScreen?: boolean;
  className?: string;
};

export default function PlantLoading({ text = "正在加载绿色能量...", compact = false, fullScreen = false, className = "" }: Props) {
  const rootClass = [
    styles.root,
    compact ? styles.compact : "",
    fullScreen ? styles.fullScreen : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      role="status"
      aria-live="polite"
      className={rootClass}
    >
      <div className={styles.halo} />
      <div className={styles.ripple} />

      <div className={styles.scene} aria-hidden="true">
        <div className={styles.soil} />
        <div className={styles.seed} />
        <div className={styles.stem} />
        <span className={`${styles.leaf} ${styles.leafLeft}`} />
        <span className={`${styles.leaf} ${styles.leafRight}`} />
        <span className={`${styles.leaf} ${styles.leafLeftTop}`} />
        <span className={`${styles.leaf} ${styles.leafRightTop}`} />
      </div>

      <p className={styles.text}>{text}</p>
    </div>
  );
}
