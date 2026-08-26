export type Transaction = {
  id: string;
  occurred_at: string;
  merchant: string;
  category: string;
  amount: string | number;
  currency: string;
  status: string;
  payment_method: string;
  coins_earned: number;
};

export type TransactionList = {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type CategorySlice = {
  category: string;
  total: string | number;
  count: number;
};

export type MonthlyPoint = {
  month: string;
  total: string | number;
  count: number;
};

export type Reward = {
  id: string;
  name: string;
  description: string;
  coin_cost: number;
  active: boolean;
};

export type Wallet = { balance: number };

export type TxnQuery = {
  search?: string;
  category?: string;
  status?: string;
  min_amount?: string;
  max_amount?: string;
  date_from?: string;
  date_to?: string;
  sort?: "occurred_at" | "amount";
  direction?: "asc" | "desc";
  page?: number;
  page_size?: number;
};
