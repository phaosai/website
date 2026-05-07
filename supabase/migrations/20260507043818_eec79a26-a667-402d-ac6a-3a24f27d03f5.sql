
-- 1. trading_platforms: display ordering + new platforms
ALTER TABLE public.trading_platforms ADD COLUMN IF NOT EXISTS display_order int NOT NULL DEFAULT 1000;

UPDATE public.trading_platforms SET display_order = 1 WHERE slug = 'robinhood';
UPDATE public.trading_platforms SET display_order = 2 WHERE slug = 'fidelity';
UPDATE public.trading_platforms SET display_order = 3 WHERE slug = 'webull';
UPDATE public.trading_platforms SET display_order = 4 WHERE slug = 'schwab';

INSERT INTO public.trading_platforms (slug, name, asset_classes, display_order) VALUES
  ('etrade', 'E*TRADE',                        '["stock","etf","mutual_fund","reit","adr","otc_penny","us_treasury","corporate_bond","muni_bond","future","option","carbon_credit"]'::jsonb, 5),
  ('merrill_edge', 'Merrill Edge',             '["stock","etf","mutual_fund","reit","adr","us_treasury","corporate_bond","muni_bond","option","carbon_credit"]'::jsonb, 6),
  ('vanguard', 'Vanguard',                     '["stock","etf","mutual_fund","reit","adr","us_treasury","corporate_bond","muni_bond","option"]'::jsonb, 7),
  ('ally_invest', 'Ally Invest',               '["stock","etf","mutual_fund","reit","adr","corporate_bond","option","forex"]'::jsonb, 8),
  ('jpm_self_directed', 'J.P. Morgan Self-Directed', '["stock","etf","mutual_fund","reit","adr","us_treasury","corporate_bond","option"]'::jsonb, 9),
  ('sofi', 'SoFi Invest',                      '["stock","etf","reit","major_crypto","altcoin","option"]'::jsonb, 10),
  ('public', 'Public',                         '["stock","etf","reit","us_treasury","corporate_bond","major_crypto","altcoin","option"]'::jsonb, 11),
  ('m1_finance', 'M1 Finance',                 '["stock","etf","reit","major_crypto","altcoin"]'::jsonb, 12),
  ('questrade', 'Questrade',                   '["stock","etf","mutual_fund","reit","adr","us_treasury","corporate_bond","option","forex","cfd"]'::jsonb, 13),
  ('wealthsimple', 'Wealthsimple',             '["stock","etf","mutual_fund","reit","major_crypto","altcoin"]'::jsonb, 14),
  ('revolut', 'Revolut',                       '["stock","etf","major_crypto","altcoin","metal","forex"]'::jsonb, 15),
  ('xtb', 'XTB',                               '["stock","etf","cfd","forex","metal","energy","soft_commodity","major_crypto"]'::jsonb, 16),
  ('plus500', 'Plus500',                       '["cfd","forex","metal","energy","soft_commodity","major_crypto"]'::jsonb, 17),
  ('cmc_markets', 'CMC Markets',               '["cfd","forex","metal","energy","soft_commodity","future","option"]'::jsonb, 18),
  ('gemini', 'Gemini',                         '["major_crypto","altcoin","stablecoin","defi_token"]'::jsonb, 19),
  ('crypto_com', 'Crypto.com',                 '["major_crypto","altcoin","stablecoin","defi_token","perp_swap"]'::jsonb, 20),
  ('bitstamp', 'Bitstamp',                     '["major_crypto","altcoin","stablecoin"]'::jsonb, 21),
  ('kucoin', 'KuCoin',                         '["major_crypto","altcoin","stablecoin","defi_token","perp_swap"]'::jsonb, 22)
ON CONFLICT (slug) DO UPDATE SET asset_classes = EXCLUDED.asset_classes, display_order = EXCLUDED.display_order;

-- 2. Watchlist groups
CREATE TABLE IF NOT EXISTS public.sunesis_watchlist_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'My Watchlist',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sunesis_watchlist_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wlg_self_select" ON public.sunesis_watchlist_groups FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "wlg_self_insert" ON public.sunesis_watchlist_groups FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "wlg_self_update" ON public.sunesis_watchlist_groups FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "wlg_self_delete" ON public.sunesis_watchlist_groups FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "wlg_service_manage" ON public.sunesis_watchlist_groups FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.sunesis_watchlist ADD COLUMN IF NOT EXISTS group_id uuid;

-- Backfill: ensure every user with watchlist items has a default group
INSERT INTO public.sunesis_watchlist_groups (user_id, name)
SELECT DISTINCT user_id, 'My Watchlist'
FROM public.sunesis_watchlist
WHERE user_id NOT IN (SELECT user_id FROM public.sunesis_watchlist_groups);

UPDATE public.sunesis_watchlist w
SET group_id = g.id
FROM public.sunesis_watchlist_groups g
WHERE w.group_id IS NULL AND g.user_id = w.user_id AND g.name = 'My Watchlist';

-- 3. Saved searches
CREATE TABLE IF NOT EXISTS public.sunesis_saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sunesis_saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sss_self_select" ON public.sunesis_saved_searches FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sss_self_insert" ON public.sunesis_saved_searches FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "sss_self_delete" ON public.sunesis_saved_searches FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sss_service_manage" ON public.sunesis_saved_searches FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_sss_user_created ON public.sunesis_saved_searches (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swl_user_group ON public.sunesis_watchlist (user_id, group_id);
