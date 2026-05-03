-- MoneyTracker: Initial Schema
-- All monetary values are stored as BIGINT in cents to avoid floating-point issues.

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PLAID ITEMS (one per bank connection)
-- ============================================================
CREATE TABLE public.plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plaid_item_id TEXT NOT NULL UNIQUE,
  plaid_access_token TEXT NOT NULL,
  plaid_institution_id TEXT,
  institution_name TEXT,
  transaction_cursor TEXT,
  last_synced_at TIMESTAMPTZ,
  consent_expires_at TIMESTAMPTZ,
  error_code TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'error', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plaid_items_user ON public.plaid_items(user_id);

-- ============================================================
-- ACCOUNTS (bank, credit card, investment, manual)
-- ============================================================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plaid_item_id UUID REFERENCES public.plaid_items(id) ON DELETE SET NULL,
  plaid_account_id TEXT UNIQUE,
  name TEXT NOT NULL,
  official_name TEXT,
  type TEXT NOT NULL
    CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'loan', 'other')),
  subtype TEXT,
  mask TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  current_balance_cents BIGINT DEFAULT 0,
  available_balance_cents BIGINT,
  credit_limit_cents BIGINT,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_manual BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_accounts_user ON public.accounts(user_id);
CREATE INDEX idx_accounts_plaid ON public.accounts(plaid_account_id);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_user ON public.categories(user_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  plaid_transaction_id TEXT UNIQUE,
  amount_cents BIGINT NOT NULL,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  merchant_name TEXT,
  pending BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  excluded BOOLEAN NOT NULL DEFAULT false,
  is_manual BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_account ON public.transactions(account_id);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_transactions_plaid ON public.transactions(plaid_transaction_id);

-- ============================================================
-- CATEGORY RULES (auto-categorization)
-- ============================================================
CREATE TABLE public.category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  match_field TEXT NOT NULL DEFAULT 'name'
    CHECK (match_field IN ('name', 'merchant_name')),
  match_pattern TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_category_rules_user ON public.category_rules(user_id);

-- ============================================================
-- BUDGETS
-- ============================================================
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly'
    CHECK (period IN ('monthly', 'weekly', 'yearly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_budgets_user ON public.budgets(user_id);

-- ============================================================
-- BALANCE HISTORY (daily snapshots for net worth)
-- ============================================================
CREATE TABLE public.balance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  balance_cents BIGINT NOT NULL,
  UNIQUE(account_id, date)
);

CREATE INDEX idx_balance_history_date ON public.balance_history(account_id, date DESC);

-- ============================================================
-- INCOME SOURCES
-- ============================================================
CREATE TABLE public.income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'salary'
    CHECK (type IN ('salary', 'freelance', 'investment', 'rental', 'other')),
  expected_amount_cents BIGINT,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_income_sources_user ON public.income_sources(user_id);

-- ============================================================
-- SPLIT GROUPS
-- ============================================================
CREATE TABLE public.split_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_split_groups_user ON public.split_groups(user_id);

-- ============================================================
-- SPLIT MEMBERS
-- ============================================================
CREATE TABLE public.split_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.split_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  is_self BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_split_members_group ON public.split_members(group_id);

-- ============================================================
-- SPLIT EXPENSES
-- ============================================================
CREATE TABLE public.split_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.split_groups(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  total_amount_cents BIGINT NOT NULL,
  paid_by_member_id UUID NOT NULL REFERENCES public.split_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_split_expenses_group ON public.split_expenses(group_id);

-- ============================================================
-- SPLIT SHARES
-- ============================================================
CREATE TABLE public.split_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.split_expenses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.split_members(id) ON DELETE CASCADE,
  share_amount_cents BIGINT NOT NULL,
  UNIQUE(expense_id, member_id)
);

-- ============================================================
-- CSV MAPPINGS (saved column mappings per bank for repeat imports)
-- ============================================================
CREATE TABLE public.csv_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  column_map JSONB NOT NULL,
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_csv_mappings_user ON public.csv_mappings(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_mappings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Plaid items
CREATE POLICY "Users can view own plaid items" ON public.plaid_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plaid items" ON public.plaid_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plaid items" ON public.plaid_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plaid items" ON public.plaid_items
  FOR DELETE USING (auth.uid() = user_id);

-- Accounts
CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Categories: users see system categories + their own
CREATE POLICY "Users can view categories" ON public.categories
  FOR SELECT USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id AND is_system = false);
CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Category rules
CREATE POLICY "Users can view own category rules" ON public.category_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own category rules" ON public.category_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own category rules" ON public.category_rules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own category rules" ON public.category_rules
  FOR DELETE USING (auth.uid() = user_id);

-- Budgets
CREATE POLICY "Users can view own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Balance history: access through account ownership
CREATE POLICY "Users can view own balance history" ON public.balance_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.accounts WHERE id = account_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert own balance history" ON public.balance_history
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.accounts WHERE id = account_id AND user_id = auth.uid())
  );

-- Income sources
CREATE POLICY "Users can view own income sources" ON public.income_sources
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income sources" ON public.income_sources
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income sources" ON public.income_sources
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income sources" ON public.income_sources
  FOR DELETE USING (auth.uid() = user_id);

-- Split groups
CREATE POLICY "Users can view own split groups" ON public.split_groups
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own split groups" ON public.split_groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own split groups" ON public.split_groups
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own split groups" ON public.split_groups
  FOR DELETE USING (auth.uid() = user_id);

-- Split members: access through group ownership
CREATE POLICY "Users can view own split members" ON public.split_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.split_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert own split members" ON public.split_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.split_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can update own split members" ON public.split_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.split_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete own split members" ON public.split_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.split_groups WHERE id = group_id AND user_id = auth.uid())
  );

-- Split expenses: access through group ownership
CREATE POLICY "Users can view own split expenses" ON public.split_expenses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.split_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert own split expenses" ON public.split_expenses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.split_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can update own split expenses" ON public.split_expenses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.split_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete own split expenses" ON public.split_expenses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.split_groups WHERE id = group_id AND user_id = auth.uid())
  );

-- Split shares: access through group ownership via expense
CREATE POLICY "Users can view own split shares" ON public.split_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.split_expenses se
      JOIN public.split_groups sg ON sg.id = se.group_id
      WHERE se.id = expense_id AND sg.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own split shares" ON public.split_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.split_expenses se
      JOIN public.split_groups sg ON sg.id = se.group_id
      WHERE se.id = expense_id AND sg.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own split shares" ON public.split_shares
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.split_expenses se
      JOIN public.split_groups sg ON sg.id = se.group_id
      WHERE se.id = expense_id AND sg.user_id = auth.uid()
    )
  );

-- CSV mappings
CREATE POLICY "Users can view own csv mappings" ON public.csv_mappings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own csv mappings" ON public.csv_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own csv mappings" ON public.csv_mappings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own csv mappings" ON public.csv_mappings
  FOR DELETE USING (auth.uid() = user_id);
