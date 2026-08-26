"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "./ui/Card";
import { api } from "@/lib/api";
import type { TxnQuery } from "@/lib/types";

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function monthBounds(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
  return { date_from: start.toISOString(), date_to: end.toISOString() };
}

export function MonthlyChart({
  filters,
  activeMonth,
  onSelect,
}: {
  filters: TxnQuery;
  activeMonth?: string;
  onSelect: (month: string | undefined, bounds?: { date_from: string; date_to: string }) => void;
}) {
  const q = useQuery({
    queryKey: ["analytics-month", filters],
    queryFn: () => api.monthly(filters),
  });
  const data = (q.data ?? []).map((d) => ({ month: d.month, total: Number(d.total) }));

  return (
    <Card
      title="Monthly trend"
      action={
        activeMonth ? (
          <button type="button" className="muted" onClick={() => onSelect(undefined)}>
            Clear
          </button>
        ) : null
      }
    >
      {q.isError && <p className="error-banner">Could not load monthly spend.</p>}
      {q.isLoading && <p className="muted">Loading chart…</p>}
      {!q.isLoading && data.length === 0 && <p className="muted">Nothing to plot for these filters.</p>}
      {data.length > 0 && (
        <div style={{ height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={data} onClick={(state) => {
              const month = (state as { activeLabel?: string }).activeLabel;
              if (!month) return;
              if (activeMonth === month) onSelect(undefined);
              else onSelect(month, monthBounds(month));
            }}>
              <CartesianGrid stroke="#2a3654" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#9aa8c7", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                tick={{ fill: "#9aa8c7", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                formatter={(v) => inr(Number(v))}
                contentStyle={{ background: "#121a2b", border: "1px solid #2a3654", borderRadius: 8 }}
              />
              <Bar dataKey="total" fill="#3dceb1" radius={[6, 6, 0, 0]} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, margin: 0 }}>
        Click a bar to filter the table to that month.
      </p>
    </Card>
  );
}
