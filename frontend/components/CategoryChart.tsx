"use client";

import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "./ui/Card";
import { api } from "@/lib/api";
import type { TxnQuery } from "@/lib/types";

const COLORS: Record<string, string> = {
  "Food & Dining": "var(--chart-food)",
  Shopping: "var(--chart-shop)",
  Utilities: "var(--chart-util)",
  Health: "var(--chart-health)",
  Travel: "var(--chart-travel)",
  Education: "var(--chart-edu)",
  Entertainment: "var(--chart-ent)",
  Groceries: "var(--chart-groc)",
  Fuel: "var(--chart-fuel)",
  Insurance: "var(--chart-ins)",
  Uncategorized: "var(--chart-other)",
};

const FALLBACK = ["#3dceb1", "#7aa2ff", "#e8c36a", "#f07178", "#c084fc", "#5bd38a", "#fb923c", "#67e8f9"];

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function CategoryChart({
  filters,
  activeCategory,
  onSelect,
}: {
  filters: TxnQuery;
  activeCategory?: string;
  onSelect: (category: string | undefined) => void;
}) {
  const q = useQuery({
    queryKey: ["analytics-cat", filters],
    queryFn: () => api.byCategory(filters),
  });

  const data = (q.data ?? []).map((d, i) => ({
    name: d.category,
    value: Number(d.total),
    fill: COLORS[d.category] ?? FALLBACK[i % FALLBACK.length],
  }));

  return (
    <Card
      title="Spend by category"
      action={
        activeCategory ? (
          <button type="button" className="muted" onClick={() => onSelect(undefined)}>
            Clear
          </button>
        ) : null
      }
    >
      {q.isError && <p className="error-banner">Could not load category spend.</p>}
      {q.isLoading && <p className="muted">Loading chart…</p>}
      {!q.isLoading && data.length === 0 && <p className="muted">Nothing to plot for these filters.</p>}
      {data.length > 0 && (
        <div style={{ height: 280 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
                onClick={(slice) => {
                  const name = (slice as { name?: string }).name;
                  if (!name) return;
                  onSelect(activeCategory === name ? undefined : name);
                }}
              >
                {data.map((d) => (
                  <Cell
                    key={d.name}
                    fill={d.fill}
                    opacity={!activeCategory || activeCategory === d.name ? 1 : 0.35}
                    cursor="pointer"
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => inr(Number(v))}
                contentStyle={{ background: "#121a2b", border: "1px solid #2a3654", borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, margin: 0 }}>
        Click a slice to filter the table.
      </p>
    </Card>
  );
}
