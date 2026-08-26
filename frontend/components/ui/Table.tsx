import type { KeyboardEvent, ReactNode } from "react";
import styles from "./Table.module.css";

export type Column<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
};

type Sort = { key: string; direction: "asc" | "desc" } | null;

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  sort?: Sort;
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
};

export function Table<T>({
  columns,
  rows,
  getRowId,
  sort,
  onSort,
  onRowClick,
  loading,
  error,
  emptyMessage = "No transactions match these filters.",
}: Props<T>) {
  const colCount = columns.length;

  const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (!onRowClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <div className={styles.wrap} role="region" aria-label="Transactions" tabIndex={0}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => {
              const active = sort?.key === col.key;
              const ariaSort = active ? (sort.direction === "asc" ? "ascending" : "descending") : "none";
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width }}
                  className={col.align === "right" ? styles.right : undefined}
                  aria-sort={col.sortable ? ariaSort : undefined}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className={styles.sort}
                      onClick={() => onSort?.(col.key)}
                    >
                      {col.header}
                      <span aria-hidden className={styles.arrow}>
                        {active ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={colCount}>
                <div className={styles.state}>Loading transactions…</div>
              </td>
            </tr>
          )}
          {!loading && error && (
            <tr>
              <td colSpan={colCount}>
                <div className={`${styles.state} ${styles.err}`}>{error}</div>
              </td>
            </tr>
          )}
          {!loading && !error && rows.length === 0 && (
            <tr>
              <td colSpan={colCount}>
                <div className={styles.state}>{emptyMessage}</div>
              </td>
            </tr>
          )}
          {!loading &&
            !error &&
            rows.map((row) => (
              <tr
                key={getRowId(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(e) => onRowKey(e, row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={col.align === "right" ? styles.right : undefined}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
