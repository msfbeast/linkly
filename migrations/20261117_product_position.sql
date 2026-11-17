-- Let owners set the order of products on their store page.
--
-- position is set when the owner drags products in the dashboard; products
-- never arranged keep NULL and show first, newest first
-- (utils/productList.ts sortProducts). Ordering happens in the app, so the
-- app works before this is applied; only saving a new order needs it.
--
-- Additive, no data change. Safe to re-run.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS position integer;
