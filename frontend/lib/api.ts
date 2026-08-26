import type {
  CategorySlice,
  MonthlyPoint,
  Reward,
  Transaction,
  TransactionList,
  TxnQuery,
  Wallet,
} from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function qs(params: Record<string, string | number | undefined>) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === "") return;
    u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : "";
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function txnParams(q: TxnQuery) {
  return qs({
    search: q.search,
    category: q.category,
    status: q.status,
    min_amount: q.min_amount,
    max_amount: q.max_amount,
    date_from: q.date_from,
    date_to: q.date_to,
    sort: q.sort,
    direction: q.direction,
    page: q.page,
    page_size: q.page_size,
  });
}

export const api = {
  transactions: (q: TxnQuery) => get<TransactionList>(`/transactions${txnParams(q)}`),
  transaction: (id: string) => get<Transaction>(`/transactions/${id}`),
  categories: () => get<string[]>("/transactions/categories"),
  byCategory: (q: TxnQuery) => get<CategorySlice[]>(`/analytics/by-category${txnParams(q)}`),
  monthly: (q: TxnQuery) => get<MonthlyPoint[]>(`/analytics/monthly${txnParams(q)}`),
  rewards: () => get<Reward[]>("/rewards"),
  wallet: () => get<Wallet>("/wallet"),
  redeem: async (reward_id: string) => {
    const res = await fetch(`${API}/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reward_id }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const code = body?.detail?.code ?? "redeem_failed";
      const message = body?.detail?.detail ?? body?.detail ?? "Could not redeem";
      throw Object.assign(new Error(String(message)), { code, status: res.status });
    }
    return body as { redemption_id: number; reward_id: string; coins_spent: number; balance: number };
  },
};
