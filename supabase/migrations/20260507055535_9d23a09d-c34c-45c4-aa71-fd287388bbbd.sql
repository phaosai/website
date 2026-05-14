-- 1. Users: country, public handle, public toggle
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS public_handle text,
  ADD COLUMN IF NOT EXISTS handle_is_public boolean NOT NULL DEFAULT false;

-- 2. Watchlist groups: public flag (per-group; default mirrors user toggle in app code)
ALTER TABLE public.sunesis_watchlist_groups
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- 3. Profanity mask trigger for public_handle
CREATE OR REPLACE FUNCTION public.mask_profanity_in_handle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  bad text;
  bad_words text[] := ARRAY[
    'fuck','shit','bitch','asshole','dick','cock','pussy','cunt','slut','whore',
    'bastard','damn','nigger','nigga','faggot','fag','retard','rape','porn',
    'sex','xxx','nazi','hitler','kill','murder','suicide','heroin','cocaine',
    'meth','crack','idiot','stupid','moron','jerk','douche','prick','wank','tit'
  ];
BEGIN
  IF NEW.public_handle IS NULL THEN RETURN NEW; END IF;
  FOREACH bad IN ARRAY bad_words LOOP
    NEW.public_handle := regexp_replace(NEW.public_handle, bad, repeat('*', length(bad)), 'gi');
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mask_profanity_handle ON public.users;
CREATE TRIGGER trg_mask_profanity_handle
BEFORE INSERT OR UPDATE OF public_handle ON public.users
FOR EACH ROW EXECUTE FUNCTION public.mask_profanity_in_handle();

-- 4. login_events country capture
ALTER TABLE public.login_events
  ADD COLUMN IF NOT EXISTS country_code text;

-- 5. Public read policy on trading_platforms (catalog is non-sensitive)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='trading_platforms' AND policyname='tp_public_read') THEN
    CREATE POLICY "tp_public_read" ON public.trading_platforms FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

-- 6. Massive platform catalog expansion (uses ON CONFLICT to upsert)
INSERT INTO public.trading_platforms (slug, name, asset_classes, display_order) VALUES
  -- Equity / multi-asset
  ('lightspeed','Lightspeed', '["stock","etf","option","future"]'::jsonb, 50),
  ('cobra','Cobra Trading', '["stock","etf","otc_penny","option"]'::jsonb, 51),
  ('centerpoint','CenterPoint Securities', '["stock","etf","otc_penny","option"]'::jsonb, 52),
  ('firstrade','Firstrade', '["stock","etf","mutual_fund","reit","adr","option","corporate_bond"]'::jsonb, 53),
  ('axos','Axos Self-Directed Trading', '["stock","etf","mutual_fund","reit","option"]'::jsonb, 54),
  ('stockpile','Stockpile', '["stock","etf"]'::jsonb, 55),
  ('cashapp','Cash App Investing', '["stock","etf","major_crypto"]'::jsonb, 56),
  ('stash','Stash', '["stock","etf","major_crypto"]'::jsonb, 57),
  ('acorns','Acorns', '["stock","etf"]'::jsonb, 58),
  ('wealthfront','Wealthfront', '["stock","etf","mutual_fund","us_treasury"]'::jsonb, 59),
  ('betterment','Betterment', '["etf","us_treasury","major_crypto"]'::jsonb, 60),
  ('ninja_trader','NinjaTrader', '["future","option","forex"]'::jsonb, 61),
  ('tradier','Tradier', '["stock","etf","option"]'::jsonb, 62),
  ('amp_futures','AMP Futures', '["future","option"]'::jsonb, 63),
  ('thinkmarkets','ThinkMarkets', '["cfd","forex","metal","energy","major_crypto"]'::jsonb, 64),
  ('avatrade','AvaTrade', '["cfd","forex","metal","energy","soft_commodity","major_crypto","option"]'::jsonb, 65),
  ('forex_com','FOREX.com', '["forex","cfd","metal","energy"]'::jsonb, 66),
  ('fxcm','FXCM', '["forex","cfd","metal","energy"]'::jsonb, 67),
  ('exness','Exness', '["forex","cfd","metal","energy","major_crypto"]'::jsonb, 68),
  ('icmarkets','IC Markets', '["forex","cfd","metal","energy","future","major_crypto"]'::jsonb, 69),
  ('pepperstone','Pepperstone', '["forex","cfd","metal","energy","major_crypto"]'::jsonb, 70),
  ('xm','XM', '["forex","cfd","metal","energy","major_crypto"]'::jsonb, 71),
  ('tickmill','Tickmill', '["forex","cfd","metal","energy","future","stock"]'::jsonb, 72),
  ('fp_markets','FP Markets', '["forex","cfd","metal","energy","major_crypto","stock"]'::jsonb, 73),
  ('vantage','Vantage', '["forex","cfd","metal","energy","major_crypto","stock"]'::jsonb, 74),
  ('city_index','City Index', '["cfd","forex","metal","energy"]'::jsonb, 75),
  ('swissquote','Swissquote', '["stock","etf","forex","cfd","mutual_fund","corporate_bond","major_crypto"]'::jsonb, 76),
  ('trade_republic','Trade Republic', '["stock","etf","reit","corporate_bond","major_crypto","option"]'::jsonb, 77),
  ('scalable_capital','Scalable Capital', '["stock","etf","mutual_fund","major_crypto"]'::jsonb, 78),
  ('lightyear','Lightyear', '["stock","etf","us_treasury","corporate_bond","major_crypto"]'::jsonb, 79),
  ('comdirect','comdirect', '["stock","etf","mutual_fund","corporate_bond","warrant","cfd"]'::jsonb, 80),
  ('flatex','flatex', '["stock","etf","mutual_fund","corporate_bond","warrant","future","option"]'::jsonb, 81),
  ('zulutrade','ZuluTrade', '["forex","cfd","major_crypto","stock"]'::jsonb, 82),
  -- Banks (US/Canada/AU/EU brokerages)
  ('wells_wellstrade','Wells Fargo WellsTrade','["stock","etf","mutual_fund","reit","corporate_bond","option"]'::jsonb, 83),
  ('edward_jones','Edward Jones','["stock","etf","mutual_fund","reit","corporate_bond","muni_bond","us_treasury"]'::jsonb, 84),
  ('raymond_james','Raymond James','["stock","etf","mutual_fund","reit","corporate_bond","muni_bond","us_treasury","option"]'::jsonb, 85),
  ('ibkr_lite','Interactive Brokers Lite','["stock","etf","reit","option","major_crypto"]'::jsonb, 86),
  ('cibc_edge','CIBC Investor''s Edge','["stock","etf","mutual_fund","reit","corporate_bond","option"]'::jsonb, 87),
  ('rbc_direct','RBC Direct Investing','["stock","etf","mutual_fund","reit","corporate_bond","option"]'::jsonb, 88),
  ('bmo_investorline','BMO InvestorLine','["stock","etf","mutual_fund","reit","corporate_bond","option"]'::jsonb, 89),
  ('td_direct','TD Direct Investing','["stock","etf","mutual_fund","reit","corporate_bond","option"]'::jsonb, 90),
  ('national_bank_direct','National Bank Direct Brokerage','["stock","etf","mutual_fund","reit","corporate_bond","option"]'::jsonb, 91),
  ('commsec','CommSec','["stock","etf","reit","corporate_bond","option","warrant"]'::jsonb, 92),
  ('selfwealth','SelfWealth','["stock","etf","reit"]'::jsonb, 93),
  ('stake','Stake','["stock","etf","reit","option"]'::jsonb, 94),
  ('sharesies','Sharesies','["stock","etf","mutual_fund"]'::jsonb, 95),
  ('hatch','Hatch','["stock","etf"]'::jsonb, 96),
  ('tiger_brokers','Tiger Brokers','["stock","etf","reit","option","future","mutual_fund"]'::jsonb, 97),
  ('futubull','Futu/Moomoo Futubull','["stock","etf","reit","option","mutual_fund"]'::jsonb, 98),
  -- Crypto CEX / DEX expansion
  ('coinbase_advanced','Coinbase Advanced','["major_crypto","altcoin","stablecoin","defi_token","perp_swap","rwa"]'::jsonb, 100),
  ('kraken_pro','Kraken Pro','["major_crypto","altcoin","stablecoin","perp_swap","defi_token","rwa"]'::jsonb, 101),
  ('binance_us','Binance.US','["major_crypto","altcoin","stablecoin"]'::jsonb, 102),
  ('bitfinex','Bitfinex','["major_crypto","altcoin","stablecoin","perp_swap","defi_token"]'::jsonb, 103),
  ('mexc','MEXC','["major_crypto","altcoin","stablecoin","perp_swap","defi_token"]'::jsonb, 104),
  ('bingx','BingX','["major_crypto","altcoin","perp_swap","stablecoin"]'::jsonb, 105),
  ('bitflyer','bitFlyer','["major_crypto","altcoin","stablecoin"]'::jsonb, 106),
  ('bitso','Bitso','["major_crypto","altcoin","stablecoin"]'::jsonb, 107),
  ('mercado_bitcoin','Mercado Bitcoin','["major_crypto","altcoin","stablecoin","rwa"]'::jsonb, 108),
  ('ndax','NDAX','["major_crypto","altcoin","stablecoin"]'::jsonb, 109),
  ('newton','Newton','["major_crypto","altcoin","stablecoin"]'::jsonb, 110),
  ('bitgo','BitGo','["major_crypto","stablecoin","rwa"]'::jsonb, 111),
  ('dydx','dYdX','["perp_swap","defi_token"]'::jsonb, 112),
  ('gmx','GMX','["perp_swap","defi_token","major_crypto"]'::jsonb, 113),
  ('hyperliquid','Hyperliquid','["perp_swap","defi_token","major_crypto"]'::jsonb, 114),
  ('jupiter','Jupiter','["defi_token","altcoin","stablecoin","major_crypto"]'::jsonb, 115)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  asset_classes = EXCLUDED.asset_classes,
  display_order = EXCLUDED.display_order;

-- 7. Index for leaderboard scans
CREATE INDEX IF NOT EXISTS idx_swl_added ON public.sunesis_watchlist (added_at);
CREATE INDEX IF NOT EXISTS idx_swlg_public ON public.sunesis_watchlist_groups (is_public) WHERE is_public = true;