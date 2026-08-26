"use client";

import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Transaction, TxnQuery } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Modal } from "./ui/Modal";
import { Table, type Column } from "./ui/Table";
import { CategoryChart } from "./CategoryChart";
import { MonthlyChart } from "./MonthlyChart";
import { Rewards } from "./Rewards";

function inr(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function Dashboard() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDeferredValue(searchInput);
  const [category, setCategory] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<"occurred_at" | "amount">("occurred_at");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [activeMonth, setActiveMonth] = useState<string | undefined>();
  const [selected, setSelected] = useState<Transaction | null>(null);

  const filters: TxnQuery = useMemo(
    () => ({
      search: search.trim() || undefined,
      category,
      status,
      min_amount: minAmount || undefined,
      max_amount: maxAmount || undefined,
      date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      date_to: dateTo ? new Date(`${dateTo}T23:59:59`).toISOString() : undefined,
      sort,
      direction,
      page,
      page_size: 25,
    }),
    [search, category, status, minAmount, maxAmount, dateFrom, dateTo, sort, direction, page],
  );

  const chartFilters: TxnQuery = { ...filters, page: undefined, page_size: undefined, sort: undefined, direction: undefined };

  const wallet = useQuery({ queryKey: ["wallet"], queryFn: api.wallet });
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const txns = useQuery({ queryKey: ["transactions", filters], queryFn: () => api.transactions(filters) });

  const onSort = (key: string) => {
    if (key !== "occurred_at" && key !== "amount") return;
    setPage(1);
    if (sort === key) setDirection((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDirection(key === "amount" ? "desc" : "desc");
    }
  };

  const columns: Column<Transaction>[] = [
    {
      key: "occurred_at",
      header: "Date",
      sortable: true,
      width: "18%",
      render: (r) => fmtDate(r.occurred_at),
    },
    { key: "merchant", header: "Merchant", width: "22%", render: (r) => r.merchant },
    { key: "category", header: "Category", width: "16%", render: (r) => r.category },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      width: "16%",
      render: (r) => inr(r.amount),
    },
    { key: "status", header: "Status", width: "12%", render: (r) => <Badge>{r.status}</Badge> },
    { key: "payment_method", header: "Method", width: "16%", render: (r) => r.payment_method },
  ];

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">Raya Pay</span>
          <span className="brand-sub">Bills, spend, and coins</span>
        </div>
        <div className="coin-chip" aria-live="polite">
          <span aria-hidden>◉</span>
          {wallet.isLoading ? "…" : `${wallet.data?.balance.toLocaleString("en-IN") ?? 0} coins`}
        </div>
      </header>

      <div className="app-shell">
        <div className="page-intro">
          <h1>Your spending, clearly.</h1>
          <p>
            Filter the full ledger, click a chart to zoom in, and redeem coins earned on successful payments — one
            coin per ₹100, capped at 50 per transaction.
          </p>
        </div>

        <div className="grid-2">
          <CategoryChart
            filters={chartFilters}
            activeCategory={category}
            onSelect={(c) => {
              setCategory(c);
              setPage(1);
            }}
          />
          <MonthlyChart
            filters={{ ...chartFilters, date_from: undefined, date_to: undefined }}
            activeMonth={activeMonth}
            onSelect={(month, bounds) => {
              setActiveMonth(month);
              if (bounds) {
                setDateFrom(bounds.date_from.slice(0, 10));
                setDateTo(bounds.date_to.slice(0, 10));
              } else {
                setDateFrom("");
                setDateTo("");
              }
              setPage(1);
            }}
          />
        </div>

        <Rewards />

        <Card title="Transactions">
          <div className="filters">
            <div className="field">
              <label htmlFor="search">Merchant</label>
              <input
                id="search"
                value={searchInput}
                placeholder="Search as you type"
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="field">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={category ?? ""}
                onChange={(e) => {
                  setCategory(e.target.value || undefined);
                  setPage(1);
                }}
              >
                <option value="">All</option>
                {(categories.data ?? []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status ?? ""}
                onChange={(e) => {
                  setStatus(e.target.value || undefined);
                  setPage(1);
                }}
              >
                <option value="">All</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="from">From</label>
              <input
                id="from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setActiveMonth(undefined);
                  setPage(1);
                }}
              />
            </div>
            <div className="field">
              <label htmlFor="to">To</label>
              <input
                id="to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setActiveMonth(undefined);
                  setPage(1);
                }}
              />
            </div>
            <div className="field">
              <label htmlFor="min">Amount</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  id="min"
                  inputMode="decimal"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    setPage(1);
                  }}
                />
                <input
                  inputMode="decimal"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="table-meta">
            <span>
              {txns.data
                ? `${txns.data.total.toLocaleString("en-IN")} matching · page ${txns.data.page} of ${txns.data.pages || 1}`
                : "—"}
            </span>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchInput("");
                setCategory(undefined);
                setStatus(undefined);
                setMinAmount("");
                setMaxAmount("");
                setDateFrom("");
                setDateTo("");
                setActiveMonth(undefined);
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>

          <Table
            columns={columns}
            rows={txns.data?.items ?? []}
            getRowId={(r) => r.id}
            sort={{ key: sort, direction }}
            onSort={onSort}
            onRowClick={setSelected}
            loading={txns.isLoading}
            error={txns.isError ? "Could not load transactions. Is the API running?" : null}
          />

          <div className="table-meta">
            <span className="muted">Click a row for detail. Table is server-paginated.</span>
            <div className="pager">
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="ghost"
                disabled={!txns.data || page >= (txns.data.pages || 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Modal open={!!selected} title={selected?.merchant ?? "Transaction"} onClose={() => setSelected(null)}>
        {selected && (
          <dl className="detail-grid">
            <div>
              <dt>ID</dt>
              <dd>{selected.id}</dd>
            </div>
            <div>
              <dt>When (UTC)</dt>
              <dd>{fmtDate(selected.occurred_at)}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{inr(selected.amount)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <Badge>{selected.status}</Badge>
              </dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{selected.category}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{selected.payment_method}</dd>
            </div>
            <div>
              <dt>Coins earned</dt>
              <dd>{selected.coins_earned}</dd>
            </div>
            <div>
              <dt>Currency</dt>
              <dd>{selected.currency}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </>
  );
}
