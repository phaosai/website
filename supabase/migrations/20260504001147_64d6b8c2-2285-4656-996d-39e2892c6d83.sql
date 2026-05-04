
-- Signal findings emitted per run
CREATE TABLE public.signal_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid,
  organization_id uuid,
  ticker text NOT NULL,
  category text NOT NULL,
  headline text NOT NULL,
  evidence text,
  source jsonb,
  direction text NOT NULL CHECK (direction IN ('supports','detracts','neutral')),
  confidence text NOT NULL CHECK (confidence IN ('strong','moderate','weak')),
  weight numeric NOT NULL DEFAULT 1,
  rank integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_signal_findings_run ON public.signal_findings(run_id);
CREATE INDEX idx_signal_findings_org ON public.signal_findings(organization_id);
ALTER TABLE public.signal_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "findings_member_select" ON public.signal_findings
FOR SELECT TO authenticated
USING (organization_id IS NULL OR public.is_org_member(organization_id));

CREATE POLICY "findings_service_manage" ON public.signal_findings
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Truth ledger lines
CREATE TABLE public.truth_ledger_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  organization_id uuid,
  line text NOT NULL,
  source_family text,
  status text NOT NULL DEFAULT 'info' CHECK (status IN ('info','ok','warn','error','skipped')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_truth_ledger_run ON public.truth_ledger_lines(run_id);
ALTER TABLE public.truth_ledger_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ledger_member_select" ON public.truth_ledger_lines
FOR SELECT TO authenticated
USING (organization_id IS NULL OR public.is_org_member(organization_id));

CREATE POLICY "ledger_service_manage" ON public.truth_ledger_lines
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Trading platforms catalog
CREATE TABLE public.trading_platforms (
  slug text PRIMARY KEY,
  name text NOT NULL,
  asset_classes jsonb NOT NULL DEFAULT '[]'::jsonb,
  region text,
  retail_access boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trading_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platforms_read_all" ON public.trading_platforms
FOR SELECT TO authenticated USING (true);

CREATE POLICY "platforms_service_manage" ON public.trading_platforms
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Extend cache_warmup_tickers with asset_class
ALTER TABLE public.cache_warmup_tickers
  ADD COLUMN IF NOT EXISTS asset_class text NOT NULL DEFAULT 'equity';

-- Seed platform catalog
INSERT INTO public.trading_platforms (slug, name, asset_classes, region, retail_access) VALUES
('ibkr','Interactive Brokers','["stock","etf","mutual_fund","reit","adr","us_treasury","corporate_bond","muni_bond","future","option","warrant","forex"]','global',true),
('schwab','Charles Schwab / Thinkorswim','["stock","etf","mutual_fund","reit","adr","us_treasury","corporate_bond","muni_bond","future","option"]','us',true),
('fidelity','Fidelity','["stock","etf","mutual_fund","reit","adr","us_treasury","corporate_bond","muni_bond","option"]','us',true),
('tradestation','TradeStation','["stock","etf","future","option","major_crypto"]','us',true),
('robinhood','Robinhood','["stock","etf","option","major_crypto"]','us',true),
('webull','Webull','["stock","etf","option","major_crypto"]','us',true),
('etoro','eToro','["stock","etf","forex","major_crypto","cfd"]','global',true),
('trading212','Trading 212','["stock","etf","cfd"]','eu',true),
('degiro','DEGIRO','["stock","etf","mutual_fund","future","option","warrant","corporate_bond"]','eu',true),
('moomoo','Moomoo','["stock","etf","option"]','global',true),
('tastytrade','Tastytrade','["stock","etf","future","option","major_crypto"]','us',true),
('ig','IG Group','["cfd","forex","future","option"]','global',true),
('oanda','OANDA','["forex","cfd"]','global',true),
('saxo','Saxo Bank','["stock","etf","mutual_fund","corporate_bond","future","option","forex","cfd"]','global',true),
('binance','Binance','["major_crypto","altcoin","stablecoin","perp_swap"]','global',true),
('coinbase','Coinbase','["major_crypto","altcoin","stablecoin"]','global',true),
('kraken','Kraken','["major_crypto","altcoin","stablecoin","perp_swap"]','global',true),
('okx','OKX','["major_crypto","altcoin","perp_swap"]','global',true),
('bybit','Bybit','["major_crypto","altcoin","perp_swap"]','global',true),
('uniswap','Uniswap','["defi_token","altcoin","stablecoin"]','global',true),
('raydium','Raydium','["defi_token","altcoin","stablecoin"]','global',true),
('pancakeswap','PancakeSwap','["defi_token","altcoin","stablecoin"]','global',true);
