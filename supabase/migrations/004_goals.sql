-- Expand budgets into a full goals system
-- Supports both spending limits ("stay under $X") and saving/investing targets ("reach $X")

-- Rename budgets table to goals for clarity
ALTER TABLE public.budgets RENAME TO goals;

-- Add new columns for goal tracking
ALTER TABLE public.goals ADD COLUMN goal_type TEXT NOT NULL DEFAULT 'limit'
  CHECK (goal_type IN ('limit', 'target'));
  -- limit = spending cap (don't exceed this amount per period)
  -- target = saving/investing target (reach this amount)

ALTER TABLE public.goals ADD COLUMN target_amount_cents BIGINT;
  -- For 'target' goals: the total amount to save/invest (e.g., $10,000 emergency fund)
  -- For 'limit' goals: NULL (uses amount_cents as the per-period limit)

ALTER TABLE public.goals ADD COLUMN current_saved_cents BIGINT DEFAULT 0;
  -- Running total toward a target goal (updated when transactions hit linked account)

ALTER TABLE public.goals ADD COLUMN deadline DATE;
  -- Optional deadline for target goals (e.g., "by December 2026")

ALTER TABLE public.goals ADD COLUMN account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
  -- For target goals: the account being funded (e.g., savings account, brokerage)

-- Rename remaining RLS policies (SELECT was already changed to "Household can view budgets" by migration 003)
-- After table rename, policies still reference the table but keep their old names
ALTER POLICY "Household can view budgets" ON public.goals RENAME TO "Household can view goals";
ALTER POLICY "Users can insert own budgets" ON public.goals RENAME TO "Users can insert own goals";
ALTER POLICY "Users can update own budgets" ON public.goals RENAME TO "Users can update own goals";
ALTER POLICY "Users can delete own budgets" ON public.goals RENAME TO "Users can delete own goals";
