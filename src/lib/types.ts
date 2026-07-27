export interface CostItem {
  id: number;
  name: string;
  amount: number;
  interval: "monthly" | "yearly";
  active: number;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string | null;
  plex_username: string | null;
  source: string;
  share_type: "equal" | "weighted" | "fixed";
  share_value: number;
  active: number;
  created_at: string;
}

export interface BillingPeriod {
  id: number;
  label: string;
  total_cost: number;
  created_at: string;
}

export interface Invoice {
  id: number;
  period_id: number;
  user_id: number;
  amount_due: number;
  status: "unpaid" | "paid";
  paid_at: string | null;
  method: string | null;
  created_at: string;
}
