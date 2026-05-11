import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";

// ── Helpers ──────────────────────────────────────────────────────────
function d(daysAgo: number) {
  return format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
}

function monthDate(monthsAgo: number, day: number) {
  const base = subMonths(new Date(), monthsAgo);
  const m = startOfMonth(base);
  const target = new Date(m.getFullYear(), m.getMonth(), day);
  // clamp to end of month
  const eom = endOfMonth(base);
  return format(target > eom ? eom : target, "yyyy-MM-dd");
}

// ── IDs ──────────────────────────────────────────────────────────────
const ACCT = {
  checking: "a0000000-0000-0000-0000-000000000001",
  savings: "a0000000-0000-0000-0000-000000000002",
  amex: "a0000000-0000-0000-0000-000000000003",
  fidelity: "a0000000-0000-0000-0000-000000000004",
  apple: "a0000000-0000-0000-0000-000000000005",
};

const CAT_IDS: Record<string, string> = {
  Housing: "c0000001-0000-0000-0000-000000000001",
  "Food & Dining": "c0000001-0000-0000-0000-000000000002",
  Groceries: "c0000001-0000-0000-0000-000000000003",
  Transportation: "c0000001-0000-0000-0000-000000000004",
  Utilities: "c0000001-0000-0000-0000-000000000005",
  Entertainment: "c0000001-0000-0000-0000-000000000006",
  Shopping: "c0000001-0000-0000-0000-000000000007",
  Healthcare: "c0000001-0000-0000-0000-000000000008",
  Insurance: "c0000001-0000-0000-0000-000000000009",
  Subscriptions: "c0000001-0000-0000-0000-000000000010",
  "Personal Care": "c0000001-0000-0000-0000-000000000011",
  Education: "c0000001-0000-0000-0000-000000000012",
  "Gifts & Donations": "c0000001-0000-0000-0000-000000000013",
  Travel: "c0000001-0000-0000-0000-000000000014",
  Income: "c0000001-0000-0000-0000-000000000015",
  Transfer: "c0000001-0000-0000-0000-000000000016",
  Uncategorized: "c0000001-0000-0000-0000-000000000017",
};

const USER_ID = "demo-user-0000-0000-000000000001";

// ── Categories ───────────────────────────────────────────────────────
export const categories = [
  { id: CAT_IDS["Housing"], name: "Housing", icon: "\u{1F3E0}", color: "#6366f1", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Food & Dining"], name: "Food & Dining", icon: "\u{1F37D}\u{FE0F}", color: "#f59e0b", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Groceries"], name: "Groceries", icon: "\u{1F6D2}", color: "#84cc16", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Transportation"], name: "Transportation", icon: "\u{1F697}", color: "#06b6d4", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Utilities"], name: "Utilities", icon: "\u{1F4A1}", color: "#8b5cf6", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Entertainment"], name: "Entertainment", icon: "\u{1F3AC}", color: "#ec4899", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Shopping"], name: "Shopping", icon: "\u{1F6CD}\u{FE0F}", color: "#f97316", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Healthcare"], name: "Healthcare", icon: "\u{1F3E5}", color: "#ef4444", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Insurance"], name: "Insurance", icon: "\u{1F6E1}\u{FE0F}", color: "#64748b", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Subscriptions"], name: "Subscriptions", icon: "\u{1F4F1}", color: "#a855f7", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Personal Care"], name: "Personal Care", icon: "\u{1F488}", color: "#14b8a6", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Education"], name: "Education", icon: "\u{1F4DA}", color: "#3b82f6", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Gifts & Donations"], name: "Gifts & Donations", icon: "\u{1F381}", color: "#e11d48", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Travel"], name: "Travel", icon: "\u{2708}\u{FE0F}", color: "#0ea5e9", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Income"], name: "Income", icon: "\u{1F4B0}", color: "#22c55e", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Transfer"], name: "Transfer", icon: "\u{1F504}", color: "#94a3b8", is_system: true, user_id: null, parent_id: null },
  { id: CAT_IDS["Uncategorized"], name: "Uncategorized", icon: "\u{2753}", color: "#9ca3af", is_system: true, user_id: null, parent_id: null },
];

const catLookup = Object.fromEntries(categories.map((c) => [c.id, c]));

// ── Accounts ─────────────────────────────────────────────────────────
export const accounts = [
  { id: ACCT.checking, user_id: USER_ID, plaid_account_id: null, name: "Chase Checking", type: "checking", mask: "4892", current_balance_cents: 452389, credit_limit_cents: null, is_hidden: false, is_manual: false },
  { id: ACCT.savings, user_id: USER_ID, plaid_account_id: null, name: "Chase Savings", type: "savings", mask: "7231", current_balance_cents: 1250000, credit_limit_cents: null, is_hidden: false, is_manual: false },
  { id: ACCT.amex, user_id: USER_ID, plaid_account_id: null, name: "Amex Gold", type: "credit", mask: "1008", current_balance_cents: -87643, credit_limit_cents: 1500000, is_hidden: false, is_manual: false },
  { id: ACCT.fidelity, user_id: USER_ID, plaid_account_id: null, name: "Fidelity Brokerage", type: "investment", mask: "5510", current_balance_cents: 3420050, credit_limit_cents: null, is_hidden: false, is_manual: false },
  { id: ACCT.apple, user_id: USER_ID, plaid_account_id: null, name: "Apple Card", type: "credit", mask: "3344", current_balance_cents: -34521, credit_limit_cents: 500000, is_hidden: false, is_manual: false },
];

const acctLookup = Object.fromEntries(accounts.map((a) => [a.id, a]));

// ── Transactions ─────────────────────────────────────────────────────
// Helper to build a transaction row with joined data
let txSeq = 0;
function tx(
  accountId: string,
  categoryName: string,
  amountCents: number,
  date: string,
  name: string,
  pending = false,
) {
  const catId = CAT_IDS[categoryName];
  const cat = catLookup[catId];
  const acct = acctLookup[accountId];
  txSeq++;
  return {
    id: `t000000-0000-0000-0000-${String(txSeq).padStart(12, "0")}`,
    user_id: USER_ID,
    account_id: accountId,
    category_id: catId,
    plaid_transaction_id: null,
    amount_cents: amountCents,
    date,
    name,
    merchant_name: name,
    pending,
    notes: null,
    excluded: false,
    is_manual: false,
    created_at: `${date}T12:00:00Z`,
    // Joined relations (Supabase returns these as objects for FK relations)
    categories: cat ? { name: cat.name, icon: cat.icon, color: cat.color } : null,
    accounts: acct ? { name: acct.name } : null,
  };
}

export const transactions = [
  // ── This month ─────────────────────────────────────────────────────
  // Income
  tx(ACCT.checking, "Income", -520000, d(1), "Payroll Direct Deposit"),
  tx(ACCT.checking, "Income", -520000, d(15), "Payroll Direct Deposit"),

  // Housing & Utilities
  tx(ACCT.checking, "Housing", 185000, d(28), "Rent Payment"),
  tx(ACCT.checking, "Utilities", 12400, d(25), "Con Edison Electric"),
  tx(ACCT.checking, "Utilities", 4500, d(25), "Verizon Internet"),

  // Food & Dining (Amex)
  tx(ACCT.amex, "Food & Dining", 4250, d(27), "Sweetgreen"),
  tx(ACCT.amex, "Food & Dining", 1875, d(26), "Starbucks"),
  tx(ACCT.amex, "Food & Dining", 6800, d(23), "Chipotle"),
  tx(ACCT.amex, "Food & Dining", 3200, d(21), "Starbucks"),
  tx(ACCT.amex, "Food & Dining", 8900, d(18), "Nobu"),
  tx(ACCT.amex, "Food & Dining", 2100, d(14), "Dunkin Donuts"),
  tx(ACCT.amex, "Food & Dining", 5600, d(11), "Shake Shack"),
  tx(ACCT.amex, "Food & Dining", 3400, d(8), "Sweetgreen"),
  tx(ACCT.amex, "Food & Dining", 4100, d(4), "Chipotle"),
  tx(ACCT.amex, "Food & Dining", 1650, d(2), "Starbucks"),

  // Groceries
  tx(ACCT.amex, "Groceries", 8743, d(24), "Whole Foods Market"),
  tx(ACCT.amex, "Groceries", 6521, d(19), "Trader Joes"),
  tx(ACCT.amex, "Groceries", 9234, d(13), "Whole Foods Market"),
  tx(ACCT.amex, "Groceries", 7800, d(5), "Trader Joes"),

  // Transportation
  tx(ACCT.amex, "Transportation", 2450, d(22), "Uber"),
  tx(ACCT.amex, "Transportation", 3100, d(16), "Uber"),
  tx(ACCT.amex, "Transportation", 1800, d(9), "MTA MetroCard"),

  // Entertainment & Subscriptions
  tx(ACCT.amex, "Entertainment", 1599, d(20), "Netflix"),
  tx(ACCT.amex, "Subscriptions", 999, d(20), "Spotify"),
  tx(ACCT.amex, "Entertainment", 2500, d(3), "AMC Theatres"),
  tx(ACCT.apple, "Subscriptions", 1099, d(22), "Apple iCloud+"),
  tx(ACCT.apple, "Subscriptions", 1499, d(18), "YouTube Premium"),
  tx(ACCT.apple, "Subscriptions", 999, d(10), "ChatGPT Plus"),

  // Shopping
  tx(ACCT.amex, "Shopping", 4999, d(17), "Amazon"),
  tx(ACCT.amex, "Shopping", 12999, d(7), "Nike"),
  tx(ACCT.apple, "Shopping", 7999, d(15), "Apple Store"),

  // Other
  tx(ACCT.amex, "Healthcare", 3500, d(12), "CVS Pharmacy"),
  tx(ACCT.amex, "Personal Care", 4500, d(10), "Barber Shop"),
  tx(ACCT.amex, "Travel", 35000, d(1), "Delta Airlines"),
  tx(ACCT.apple, "Transportation", 4500, d(6), "Lyft"),

  // Pending
  tx(ACCT.amex, "Food & Dining", 3250, d(0), "Cava", true),

  // ── Last month ─────────────────────────────────────────────────────
  tx(ACCT.checking, "Income", -520000, monthDate(1, 1), "Payroll Direct Deposit"),
  tx(ACCT.checking, "Income", -520000, monthDate(1, 15), "Payroll Direct Deposit"),
  tx(ACCT.checking, "Housing", 185000, monthDate(1, 1), "Rent Payment"),
  tx(ACCT.checking, "Utilities", 11800, monthDate(1, 5), "Con Edison Electric"),
  tx(ACCT.checking, "Utilities", 4500, monthDate(1, 5), "Verizon Internet"),
  tx(ACCT.amex, "Food & Dining", 5400, monthDate(1, 3), "Sweetgreen"),
  tx(ACCT.amex, "Food & Dining", 7200, monthDate(1, 8), "Sushi Yasuda"),
  tx(ACCT.amex, "Food & Dining", 2100, monthDate(1, 12), "Starbucks"),
  tx(ACCT.amex, "Food & Dining", 4800, monthDate(1, 18), "Chipotle"),
  tx(ACCT.amex, "Food & Dining", 1900, monthDate(1, 22), "Dunkin Donuts"),
  tx(ACCT.amex, "Groceries", 9500, monthDate(1, 6), "Whole Foods Market"),
  tx(ACCT.amex, "Groceries", 7100, monthDate(1, 14), "Trader Joes"),
  tx(ACCT.amex, "Groceries", 6800, monthDate(1, 21), "Whole Foods Market"),
  tx(ACCT.amex, "Transportation", 2800, monthDate(1, 7), "Uber"),
  tx(ACCT.amex, "Transportation", 1800, monthDate(1, 16), "MTA MetroCard"),
  tx(ACCT.amex, "Entertainment", 1599, monthDate(1, 10), "Netflix"),
  tx(ACCT.amex, "Subscriptions", 999, monthDate(1, 10), "Spotify"),
  tx(ACCT.amex, "Shopping", 3499, monthDate(1, 11), "Amazon"),
  tx(ACCT.amex, "Shopping", 8999, monthDate(1, 20), "Uniqlo"),
  tx(ACCT.amex, "Healthcare", 2500, monthDate(1, 9), "CVS Pharmacy"),
  tx(ACCT.apple, "Subscriptions", 1099, monthDate(1, 10), "Apple iCloud+"),
  tx(ACCT.apple, "Subscriptions", 1499, monthDate(1, 10), "YouTube Premium"),

  // ── 2 months ago ───────────────────────────────────────────────────
  tx(ACCT.checking, "Income", -520000, monthDate(2, 1), "Payroll Direct Deposit"),
  tx(ACCT.checking, "Income", -520000, monthDate(2, 15), "Payroll Direct Deposit"),
  tx(ACCT.checking, "Housing", 185000, monthDate(2, 1), "Rent Payment"),
  tx(ACCT.amex, "Food & Dining", 14500, monthDate(2, 10), "Various Dining"),
  tx(ACCT.amex, "Groceries", 22000, monthDate(2, 12), "Various Groceries"),
  tx(ACCT.amex, "Shopping", 6500, monthDate(2, 18), "Amazon"),
  tx(ACCT.amex, "Transportation", 5200, monthDate(2, 8), "Various Transport"),
  tx(ACCT.amex, "Entertainment", 4500, monthDate(2, 20), "Various Entertainment"),
  tx(ACCT.checking, "Utilities", 15900, monthDate(2, 5), "Various Utilities"),

  // ── 3 months ago ───────────────────────────────────────────────────
  tx(ACCT.checking, "Income", -520000, monthDate(3, 1), "Payroll Direct Deposit"),
  tx(ACCT.checking, "Income", -520000, monthDate(3, 15), "Payroll Direct Deposit"),
  tx(ACCT.checking, "Housing", 185000, monthDate(3, 1), "Rent Payment"),
  tx(ACCT.amex, "Food & Dining", 18200, monthDate(3, 10), "Various Dining"),
  tx(ACCT.amex, "Groceries", 19500, monthDate(3, 12), "Various Groceries"),
  tx(ACCT.amex, "Shopping", 15000, monthDate(3, 18), "Various Shopping"),
  tx(ACCT.amex, "Transportation", 4800, monthDate(3, 8), "Various Transport"),
  tx(ACCT.checking, "Utilities", 16200, monthDate(3, 5), "Various Utilities"),

  // ── 4 months ago ───────────────────────────────────────────────────
  tx(ACCT.checking, "Income", -510000, monthDate(4, 1), "Payroll Direct Deposit"),
  tx(ACCT.checking, "Income", -510000, monthDate(4, 15), "Payroll Direct Deposit"),
  tx(ACCT.checking, "Housing", 185000, monthDate(4, 1), "Rent Payment"),
  tx(ACCT.amex, "Food & Dining", 16000, monthDate(4, 10), "Various Dining"),
  tx(ACCT.amex, "Groceries", 21000, monthDate(4, 12), "Various Groceries"),
  tx(ACCT.amex, "Shopping", 9500, monthDate(4, 18), "Various Shopping"),
  tx(ACCT.amex, "Transportation", 6100, monthDate(4, 8), "Various Transport"),
  tx(ACCT.checking, "Utilities", 15500, monthDate(4, 5), "Various Utilities"),

  // ── 5 months ago ───────────────────────────────────────────────────
  tx(ACCT.checking, "Income", -510000, monthDate(5, 1), "Payroll Direct Deposit"),
  tx(ACCT.checking, "Income", -510000, monthDate(5, 15), "Payroll Direct Deposit"),
  tx(ACCT.checking, "Housing", 185000, monthDate(5, 1), "Rent Payment"),
  tx(ACCT.amex, "Food & Dining", 13800, monthDate(5, 10), "Various Dining"),
  tx(ACCT.amex, "Groceries", 18500, monthDate(5, 12), "Various Groceries"),
  tx(ACCT.amex, "Shopping", 7200, monthDate(5, 18), "Various Shopping"),
  tx(ACCT.amex, "Transportation", 5500, monthDate(5, 8), "Various Transport"),
  tx(ACCT.checking, "Utilities", 14800, monthDate(5, 5), "Various Utilities"),
  tx(ACCT.amex, "Travel", 45000, monthDate(5, 22), "United Airlines"),
];

// ── Goals ────────────────────────────────────────────────────────────
export const goals = [
  {
    id: "g0000000-0000-0000-0000-000000000001",
    user_id: USER_ID,
    name: "Dining Budget",
    goal_type: "limit",
    category_id: CAT_IDS["Food & Dining"],
    amount_cents: 50000,
    period: "monthly",
    target_amount_cents: null,
    current_saved_cents: 0,
    deadline: null,
    account_id: null,
    is_active: true,
  },
  {
    id: "g0000000-0000-0000-0000-000000000002",
    user_id: USER_ID,
    name: "Grocery Budget",
    goal_type: "limit",
    category_id: CAT_IDS["Groceries"],
    amount_cents: 40000,
    period: "monthly",
    target_amount_cents: null,
    current_saved_cents: 0,
    deadline: null,
    account_id: null,
    is_active: true,
  },
  {
    id: "g0000000-0000-0000-0000-000000000003",
    user_id: USER_ID,
    name: "Shopping Limit",
    goal_type: "limit",
    category_id: CAT_IDS["Shopping"],
    amount_cents: 20000,
    period: "monthly",
    target_amount_cents: null,
    current_saved_cents: 0,
    deadline: null,
    account_id: null,
    is_active: true,
  },
  {
    id: "g0000000-0000-0000-0000-000000000004",
    user_id: USER_ID,
    name: "Transportation Cap",
    goal_type: "limit",
    category_id: CAT_IDS["Transportation"],
    amount_cents: 15000,
    period: "monthly",
    target_amount_cents: null,
    current_saved_cents: 0,
    deadline: null,
    account_id: null,
    is_active: true,
  },
  {
    id: "g0000000-0000-0000-0000-000000000005",
    user_id: USER_ID,
    name: "Emergency Fund",
    goal_type: "target",
    category_id: null,
    amount_cents: 0,
    period: "monthly",
    target_amount_cents: 2000000,
    current_saved_cents: 1250000,
    deadline: "2026-12-31",
    account_id: ACCT.savings,
    is_active: true,
  },
  {
    id: "g0000000-0000-0000-0000-000000000006",
    user_id: USER_ID,
    name: "Japan Trip Fund",
    goal_type: "target",
    category_id: null,
    amount_cents: 0,
    period: "monthly",
    target_amount_cents: 500000,
    current_saved_cents: 320000,
    deadline: "2027-03-15",
    account_id: null,
    is_active: true,
  },
];

// ── Notifications ────────────────────────────────────────────────────
export const notifications = [
  {
    id: "n0000000-0000-0000-0000-000000000001",
    user_id: USER_ID,
    title: "Shopping limit exceeded",
    body: "You've spent $259.97 of your $200 shopping budget this month.",
    type: "warning",
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n0000000-0000-0000-0000-000000000002",
    user_id: USER_ID,
    title: "Transactions synced",
    body: "12 new transactions imported from Chase Checking.",
    type: "info",
    read: false,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n0000000-0000-0000-0000-000000000003",
    user_id: USER_ID,
    title: "Dining budget at 85%",
    body: "You're close to your $500 monthly dining limit. $75.25 remaining.",
    type: "warning",
    read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n0000000-0000-0000-0000-000000000004",
    user_id: USER_ID,
    title: "Payroll received",
    body: "Direct deposit of $5,200.00 from Employer posted to Chase Checking.",
    type: "info",
    read: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Table registry ───────────────────────────────────────────────────
export const DEMO_TABLES: Record<string, any[]> = {
  accounts,
  categories,
  transactions,
  goals,
  notifications,
  plaid_items: [],
  profiles: [
    {
      id: USER_ID,
      display_name: "Sammi",
      currency: "USD",
      created_at: "2026-01-15T00:00:00Z",
      updated_at: new Date().toISOString(),
    },
  ],
  category_rules: [],
  balance_history: [],
  income_sources: [],
};
