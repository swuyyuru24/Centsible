-- Add household_id for partner sharing
-- Both partners get the same household_id, allowing shared access to financial data

ALTER TABLE public.profiles ADD COLUMN household_id UUID DEFAULT gen_random_uuid();

-- Update RLS policies to allow household members to view shared data
-- Each user can see data from anyone in their household

-- Accounts: household members can view, but only owner can modify
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
CREATE POLICY "Household can view accounts" ON public.accounts
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.profiles
      WHERE household_id = (SELECT household_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Transactions: household members can view
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Household can view transactions" ON public.transactions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.profiles
      WHERE household_id = (SELECT household_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Budgets: household members can view
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
CREATE POLICY "Household can view budgets" ON public.budgets
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.profiles
      WHERE household_id = (SELECT household_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Categories: keep as-is (system categories + own categories visible to all)

-- Balance history: household can view through shared accounts
DROP POLICY IF EXISTS "Users can view own balance history" ON public.balance_history;
CREATE POLICY "Household can view balance history" ON public.balance_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.accounts a
      JOIN public.profiles p ON p.id = a.user_id
      WHERE a.id = account_id
      AND p.household_id = (SELECT household_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Income sources: household can view
DROP POLICY IF EXISTS "Users can view own income sources" ON public.income_sources;
CREATE POLICY "Household can view income sources" ON public.income_sources
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.profiles
      WHERE household_id = (SELECT household_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Plaid items: strictly per-user (each person manages their own bank connections)
-- No change to plaid_items policies
