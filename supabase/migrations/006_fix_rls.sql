-- Fix: Household RLS policies fail because the subquery on profiles
-- is also subject to profiles' own RLS. Fix by using a SECURITY DEFINER
-- function that bypasses RLS to look up household members.

CREATE OR REPLACE FUNCTION public.get_household_user_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM public.profiles
  WHERE household_id = (SELECT household_id FROM public.profiles WHERE id = auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Now update all household policies to use the function

-- Accounts
DROP POLICY IF EXISTS "Household can view accounts" ON public.accounts;
CREATE POLICY "Household can view accounts" ON public.accounts
  FOR SELECT USING (user_id IN (SELECT public.get_household_user_ids()));

-- Transactions
DROP POLICY IF EXISTS "Household can view transactions" ON public.transactions;
CREATE POLICY "Household can view transactions" ON public.transactions
  FOR SELECT USING (user_id IN (SELECT public.get_household_user_ids()));

-- Goals
DROP POLICY IF EXISTS "Household can view goals" ON public.goals;
CREATE POLICY "Household can view goals" ON public.goals
  FOR SELECT USING (user_id IN (SELECT public.get_household_user_ids()));

-- Balance history
DROP POLICY IF EXISTS "Household can view balance history" ON public.balance_history;
CREATE POLICY "Household can view balance history" ON public.balance_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = account_id
      AND a.user_id IN (SELECT public.get_household_user_ids())
    )
  );

-- Income sources
DROP POLICY IF EXISTS "Household can view income sources" ON public.income_sources;
CREATE POLICY "Household can view income sources" ON public.income_sources
  FOR SELECT USING (user_id IN (SELECT public.get_household_user_ids()));
