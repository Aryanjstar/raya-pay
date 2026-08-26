import styles from "./Badge.module.css";

const map: Record<string, string> = {
  SUCCESS: styles.ok,
  FAILED: styles.bad,
  PENDING: styles.warn,
};

export function Badge({ children }: { children: string }) {
  return <span className={`${styles.badge} ${map[children] ?? ""}`}>{children}</span>;
}
