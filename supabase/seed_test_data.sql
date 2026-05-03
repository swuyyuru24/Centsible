-- SEED TEST DATA
-- Replace YOUR-UUID-HERE with your actual user ID from: SELECT id FROM public.profiles LIMIT 1;

-- ============================================================
-- ACCOUNTS
-- ============================================================
INSERT INTO public.accounts (id, user_id, name, type, current_balance_cents, is_manual) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'YOUR-UUID-HERE', 'Chase Checking', 'checking', 452389, true),
  ('a0000000-0000-0000-0000-000000000002', 'YOUR-UUID-HERE', 'Chase Savings', 'savings', 1250000, true),
  ('a0000000-0000-0000-0000-000000000003', 'YOUR-UUID-HERE', 'Amex Gold', 'credit', -87643, true),
  ('a0000000-0000-0000-0000-000000000004', 'YOUR-UUID-HERE', 'Fidelity Brokerage', 'investment', 3420050, true),
  ('a0000000-0000-0000-0000-000000000005', 'YOUR-UUID-HERE', 'Apple Card', 'credit', -34521, true);

-- ============================================================
-- TRANSACTIONS (last 30 days of realistic data)
-- ============================================================

-- Get category IDs for seeding
DO $$
DECLARE
  uid UUID := 'YOUR-UUID-HERE';
  cat_food UUID;
  cat_groceries UUID;
  cat_transport UUID;
  cat_entertainment UUID;
  cat_shopping UUID;
  cat_subscriptions UUID;
  cat_utilities UUID;
  cat_housing UUID;
  cat_dining UUID;
  cat_income UUID;
  cat_healthcare UUID;
  cat_travel UUID;
  cat_personal UUID;
BEGIN
  SELECT id INTO cat_food FROM public.categories WHERE name = 'Food & Dining' AND is_system = true LIMIT 1;
  SELECT id INTO cat_groceries FROM public.categories WHERE name = 'Groceries' AND is_system = true LIMIT 1;
  SELECT id INTO cat_transport FROM public.categories WHERE name = 'Transportation' AND is_system = true LIMIT 1;
  SELECT id INTO cat_entertainment FROM public.categories WHERE name = 'Entertainment' AND is_system = true LIMIT 1;
  SELECT id INTO cat_shopping FROM public.categories WHERE name = 'Shopping' AND is_system = true LIMIT 1;
  SELECT id INTO cat_subscriptions FROM public.categories WHERE name = 'Subscriptions' AND is_system = true LIMIT 1;
  SELECT id INTO cat_utilities FROM public.categories WHERE name = 'Utilities' AND is_system = true LIMIT 1;
  SELECT id INTO cat_housing FROM public.categories WHERE name = 'Housing' AND is_system = true LIMIT 1;
  SELECT id INTO cat_income FROM public.categories WHERE name = 'Income' AND is_system = true LIMIT 1;
  SELECT id INTO cat_healthcare FROM public.categories WHERE name = 'Healthcare' AND is_system = true LIMIT 1;
  SELECT id INTO cat_travel FROM public.categories WHERE name = 'Travel' AND is_system = true LIMIT 1;
  SELECT id INTO cat_personal FROM public.categories WHERE name = 'Personal Care' AND is_system = true LIMIT 1;

  -- Chase Checking transactions
  INSERT INTO public.transactions (user_id, account_id, category_id, amount_cents, date, name, is_manual) VALUES
    (uid, 'a0000000-0000-0000-0000-000000000001', cat_housing, 185000, CURRENT_DATE - 28, 'Rent Payment', true),
    (uid, 'a0000000-0000-0000-0000-000000000001', cat_utilities, 12400, CURRENT_DATE - 25, 'Con Edison Electric', true),
    (uid, 'a0000000-0000-0000-0000-000000000001', cat_utilities, 4500, CURRENT_DATE - 25, 'Verizon Internet', true),
    (uid, 'a0000000-0000-0000-0000-000000000001', cat_income, -520000, CURRENT_DATE - 15, 'Payroll Direct Deposit', true),
    (uid, 'a0000000-0000-0000-0000-000000000001', cat_income, -520000, CURRENT_DATE - 1, 'Payroll Direct Deposit', true),

  -- Amex Gold transactions
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_food, 4250, CURRENT_DATE - 27, 'Sweetgreen', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_food, 1875, CURRENT_DATE - 26, 'Starbucks', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_groceries, 8743, CURRENT_DATE - 24, 'Whole Foods Market', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_food, 6800, CURRENT_DATE - 23, 'Chipotle', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_transport, 2450, CURRENT_DATE - 22, 'Uber', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_food, 3200, CURRENT_DATE - 21, 'Starbucks', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_entertainment, 1599, CURRENT_DATE - 20, 'Netflix', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_subscriptions, 999, CURRENT_DATE - 20, 'Spotify', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_groceries, 6521, CURRENT_DATE - 19, 'Trader Joes', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_food, 8900, CURRENT_DATE - 18, 'Nobu', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_shopping, 4999, CURRENT_DATE - 17, 'Amazon', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_transport, 3100, CURRENT_DATE - 16, 'Uber', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_food, 2100, CURRENT_DATE - 14, 'Dunkin Donuts', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_groceries, 9234, CURRENT_DATE - 13, 'Whole Foods Market', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_healthcare, 3500, CURRENT_DATE - 12, 'CVS Pharmacy', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_food, 5600, CURRENT_DATE - 11, 'Shake Shack', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_personal, 4500, CURRENT_DATE - 10, 'Barber Shop', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_transport, 1800, CURRENT_DATE - 9, 'MTA MetroCard', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_food, 3400, CURRENT_DATE - 8, 'Sweetgreen', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_shopping, 12999, CURRENT_DATE - 7, 'Nike', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_groceries, 7800, CURRENT_DATE - 5, 'Trader Joes', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_food, 4100, CURRENT_DATE - 4, 'Chipotle', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_entertainment, 2500, CURRENT_DATE - 3, 'AMC Theatres', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_food, 1650, CURRENT_DATE - 2, 'Starbucks', true),
    (uid, 'a0000000-0000-0000-0000-000000000003', cat_travel, 35000, CURRENT_DATE - 1, 'Delta Airlines', true),

  -- Apple Card transactions
    (uid, 'a0000000-0000-0000-0000-000000000005', cat_subscriptions, 1099, CURRENT_DATE - 22, 'Apple iCloud+', true),
    (uid, 'a0000000-0000-0000-0000-000000000005', cat_subscriptions, 1499, CURRENT_DATE - 18, 'YouTube Premium', true),
    (uid, 'a0000000-0000-0000-0000-000000000005', cat_shopping, 7999, CURRENT_DATE - 15, 'Apple Store', true),
    (uid, 'a0000000-0000-0000-0000-000000000005', cat_subscriptions, 999, CURRENT_DATE - 10, 'ChatGPT Plus', true),
    (uid, 'a0000000-0000-0000-0000-000000000005', cat_transport, 4500, CURRENT_DATE - 6, 'Lyft', true);

END $$;
