-- Seed default system categories
-- user_id is NULL for system categories, visible to all users via RLS policy

INSERT INTO public.categories (name, icon, color, is_system) VALUES
  ('Housing',           '🏠', '#6366f1', true),
  ('Food & Dining',     '🍽️', '#f59e0b', true),
  ('Groceries',         '🛒', '#84cc16', true),
  ('Transportation',    '🚗', '#06b6d4', true),
  ('Utilities',         '💡', '#8b5cf6', true),
  ('Entertainment',     '🎬', '#ec4899', true),
  ('Shopping',          '🛍️', '#f97316', true),
  ('Healthcare',        '🏥', '#ef4444', true),
  ('Insurance',         '🛡️', '#64748b', true),
  ('Subscriptions',     '📱', '#a855f7', true),
  ('Personal Care',     '💈', '#14b8a6', true),
  ('Education',         '📚', '#3b82f6', true),
  ('Gifts & Donations', '🎁', '#e11d48', true),
  ('Travel',            '✈️', '#0ea5e9', true),
  ('Income',            '💰', '#22c55e', true),
  ('Transfer',          '🔄', '#94a3b8', true),
  ('Uncategorized',     '❓', '#9ca3af', true);
