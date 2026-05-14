
-- =====================================================================
-- ENUMS
-- =====================================================================
CREATE TYPE public.org_role AS ENUM ('owner','admin','reviewer','client_viewer');
CREATE TYPE public.plan_name AS ENUM ('free','sunesis','aion','kyrios','phaos_one','pantheon');
CREATE TYPE public.subscription_status AS ENUM ('active','past_due','cancelled','trialing');
CREATE TYPE public.platform_pref AS ENUM ('robinhood','fidelity','schwab','etrade','thinkorswim','interactive_brokers','other');
CREATE TYPE public.pci_threshold AS ENUM ('no_signal','conservative','high_conviction');
CREATE TYPE public.signal_strength AS ENUM ('low','medium','high');
CREATE TYPE public.theme_status AS ENUM ('live','monitoring','archived');
CREATE TYPE public.memo_status AS ENUM ('draft','review','approved','published');
CREATE TYPE public.purchase_product_type AS ENUM ('truth_memo','conviction_pack','second_opinion','earnings_simulation');
CREATE TYPE public.purchase_status AS ENUM ('pending','completed','refunded');
CREATE TYPE public.scenario_type AS ENUM ('pre_earnings','regime_change','revenue_miss','supply_chain','macro_stress','insider_reversal','custom');
CREATE TYPE public.workflow_status AS ENUM ('draft','under_review','approved','rejected','completed');
CREATE TYPE public.portal_status AS ENUM ('active','inactive');

-- =====================================================================
-- USERS  (mirrors auth.users; FK'd to by everything else)
-- =====================================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- PLANS
-- =====================================================================
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name plan_name NOT NULL UNIQUE,
  stripe_price_id TEXT,
  monthly_price_cents INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- ORGANIZATIONS
-- =====================================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  plan_id UUID REFERENCES public.plans(id),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orgs_owner ON public.organizations(owner_id);

-- =====================================================================
-- MEMBERSHIPS
-- =====================================================================
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role org_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);
CREATE INDEX idx_memberships_user ON public.memberships(user_id);
CREATE INDEX idx_memberships_org ON public.memberships(organization_id);

-- =====================================================================
-- SUBSCRIPTIONS
-- =====================================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  stripe_subscription_id TEXT,
  status subscription_status NOT NULL,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subs_org ON public.subscriptions(organization_id);

-- =====================================================================
-- PLATFORM PREFERENCES
-- =====================================================================
CREATE TABLE public.platform_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  preferred_platform platform_pref NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- WATCHLISTS / ITEMS
-- =====================================================================
CREATE TABLE public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_watchlists_user ON public.watchlists(user_id);

CREATE TABLE public.watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  company_name TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wl_items_wl ON public.watchlist_items(watchlist_id);

-- =====================================================================
-- RESEARCH ITEMS
-- =====================================================================
CREATE TABLE public.research_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  ticker TEXT NOT NULL,
  company_name TEXT,
  pci_score INTEGER CHECK (pci_score BETWEEN 0 AND 100),
  pci_components JSONB,
  pci_threshold pci_threshold,
  sources JSONB,
  signal_categories_active JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_research_org ON public.research_items(organization_id);

-- =====================================================================
-- INVESTMENT THEMES
-- =====================================================================
CREATE TABLE public.investment_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  theme_name TEXT NOT NULL,
  narrative TEXT,
  signal_strength signal_strength,
  contributing_tickers JSONB,
  counter_thesis TEXT,
  source_categories JSONB,
  status theme_status NOT NULL DEFAULT 'monitoring',
  is_historical_example BOOLEAN NOT NULL DEFAULT FALSE,
  historical_disclaimer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_themes_org ON public.investment_themes(organization_id);

-- =====================================================================
-- TRUTH MEMOS
-- =====================================================================
CREATE TABLE public.truth_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_item_id UUID REFERENCES public.research_items(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  content TEXT,
  sources JSONB,
  bull_case TEXT,
  bear_case TEXT,
  methodology_notes TEXT,
  status memo_status NOT NULL DEFAULT 'draft',
  is_one_time_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  purchase_type purchase_product_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_memos_org ON public.truth_memos(organization_id);

-- =====================================================================
-- SIMULATION RUNS
-- =====================================================================
CREATE TABLE public.simulation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ticker TEXT,
  theme_id UUID REFERENCES public.investment_themes(id) ON DELETE SET NULL,
  scenario_type scenario_type NOT NULL,
  platform_preference platform_pref,
  assumptions JSONB,
  outputs JSONB,
  pci_before INTEGER CHECK (pci_before BETWEEN 0 AND 100),
  pci_simulated INTEGER CHECK (pci_simulated BETWEEN 0 AND 100),
  is_public_sandbox BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sim_org ON public.simulation_runs(organization_id);

-- =====================================================================
-- WORKFLOW ITEMS
-- =====================================================================
CREATE TABLE public.workflow_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  type TEXT,
  status workflow_status NOT NULL DEFAULT 'draft',
  assigned_to UUID REFERENCES public.users(id),
  truth_memo_id UUID REFERENCES public.truth_memos(id) ON DELETE SET NULL,
  research_item_id UUID REFERENCES public.research_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_workflow_org ON public.workflow_items(organization_id);

-- =====================================================================
-- AUDIT EVENTS  (append-only)
-- =====================================================================
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_org ON public.audit_events(organization_id);

-- =====================================================================
-- CLIENT PORTALS
-- =====================================================================
CREATE TABLE public.client_portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_name TEXT,
  access_token_hash TEXT,
  status portal_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_portals_org ON public.client_portals(organization_id);

-- =====================================================================
-- PUBLISHED ARTIFACTS
-- =====================================================================
CREATE TABLE public.published_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  truth_memo_id UUID REFERENCES public.truth_memos(id) ON DELETE SET NULL,
  portal_id UUID REFERENCES public.client_portals(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_pub_org ON public.published_artifacts(organization_id);

-- =====================================================================
-- ONE-TIME PURCHASES
-- =====================================================================
CREATE TABLE public.one_time_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  product_type purchase_product_type NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  status purchase_status NOT NULL DEFAULT 'pending',
  output_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_user ON public.one_time_purchases(user_id);

-- =====================================================================
-- SIGNAL CACHE
-- =====================================================================
CREATE TABLE public.signal_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  source_type TEXT NOT NULL,
  raw_data JSONB,
  processed_data JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(ticker, source_type)
);
CREATE INDEX idx_sigcache_ticker ON public.signal_cache(ticker);

-- =====================================================================
-- LOGOS SETTINGS  (Pantheon only)
-- =====================================================================
CREATE TABLE public.logos_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  firm_name TEXT,
  logo_url TEXT,
  accent_color TEXT,
  apply_to_memos BOOLEAN NOT NULL DEFAULT TRUE,
  apply_to_portals BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- SECURITY DEFINER HELPERS  (avoid recursive RLS)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE organization_id = _org_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_org_id UUID, _roles org_role[])
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE organization_id = _org_id
      AND user_id = auth.uid()
      AND role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.has_pantheon_plan(_org_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.organization_id = _org_id
      AND s.status IN ('active','trialing')
      AND p.name = 'pantheon'
  );
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_research_updated BEFORE UPDATE ON public.research_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_themes_updated BEFORE UPDATE ON public.investment_themes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create public.users row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- ENABLE RLS ON EVERYTHING
-- =====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truth_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logos_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- POLICIES
-- =====================================================================

-- USERS: own row only
CREATE POLICY "users_self_select" ON public.users FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "users_self_update" ON public.users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- PLANS: readable by all authenticated
CREATE POLICY "plans_read_all" ON public.plans FOR SELECT TO authenticated USING (true);

-- ORGANIZATIONS
CREATE POLICY "orgs_member_select" ON public.organizations FOR SELECT TO authenticated USING (public.is_org_member(id));
CREATE POLICY "orgs_create" ON public.organizations FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "orgs_admin_update" ON public.organizations FOR UPDATE TO authenticated
  USING (public.has_org_role(id, ARRAY['owner','admin']::org_role[]))
  WITH CHECK (public.has_org_role(id, ARRAY['owner','admin']::org_role[]));
CREATE POLICY "orgs_owner_delete" ON public.organizations FOR DELETE TO authenticated
  USING (public.has_org_role(id, ARRAY['owner']::org_role[]));

-- MEMBERSHIPS
CREATE POLICY "memberships_member_select" ON public.memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_member(organization_id));
CREATE POLICY "memberships_admin_insert" ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]));
CREATE POLICY "memberships_admin_update" ON public.memberships FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]));
CREATE POLICY "memberships_admin_delete" ON public.memberships FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]));

-- SUBSCRIPTIONS: members read, admins manage (Stripe webhook uses service role)
CREATE POLICY "subs_member_select" ON public.subscriptions FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

-- PLATFORM PREFERENCES: own row
CREATE POLICY "pp_self_select" ON public.platform_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "pp_self_insert" ON public.platform_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "pp_self_update" ON public.platform_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "pp_self_delete" ON public.platform_preferences FOR DELETE TO authenticated USING (user_id = auth.uid());

-- WATCHLISTS: own
CREATE POLICY "wl_self_all" ON public.watchlists FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- WATCHLIST ITEMS: via parent watchlist
CREATE POLICY "wli_self_select" ON public.watchlist_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.watchlists w WHERE w.id = watchlist_id AND w.user_id = auth.uid()));
CREATE POLICY "wli_self_insert" ON public.watchlist_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.watchlists w WHERE w.id = watchlist_id AND w.user_id = auth.uid()));
CREATE POLICY "wli_self_update" ON public.watchlist_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.watchlists w WHERE w.id = watchlist_id AND w.user_id = auth.uid()));
CREATE POLICY "wli_self_delete" ON public.watchlist_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.watchlists w WHERE w.id = watchlist_id AND w.user_id = auth.uid()));

-- Generic org-scoped helper macro (we expand inline for each table)

-- RESEARCH ITEMS
CREATE POLICY "research_member_select" ON public.research_items FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "research_reviewer_insert" ON public.research_items FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]) AND user_id = auth.uid());
CREATE POLICY "research_reviewer_update" ON public.research_items FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]));
CREATE POLICY "research_admin_delete" ON public.research_items FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]));

-- INVESTMENT THEMES
CREATE POLICY "themes_member_select" ON public.investment_themes FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "themes_reviewer_insert" ON public.investment_themes FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]));
CREATE POLICY "themes_reviewer_update" ON public.investment_themes FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]));
CREATE POLICY "themes_admin_delete" ON public.investment_themes FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]));

-- TRUTH MEMOS
CREATE POLICY "memos_member_select" ON public.truth_memos FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "memos_reviewer_insert" ON public.truth_memos FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]) AND user_id = auth.uid());
CREATE POLICY "memos_reviewer_update" ON public.truth_memos FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]));
CREATE POLICY "memos_admin_delete" ON public.truth_memos FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]));

-- SIMULATION RUNS (org-scoped; public sandbox runs go through edge function w/ service role)
CREATE POLICY "sim_member_select" ON public.simulation_runs FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id));
CREATE POLICY "sim_reviewer_insert" ON public.simulation_runs FOR INSERT TO authenticated
  WITH CHECK (organization_id IS NOT NULL AND public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]));
CREATE POLICY "sim_admin_delete" ON public.simulation_runs FOR DELETE TO authenticated
  USING (organization_id IS NOT NULL AND public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]));

-- WORKFLOW ITEMS
CREATE POLICY "wf_member_select" ON public.workflow_items FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "wf_reviewer_insert" ON public.workflow_items FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]) AND user_id = auth.uid());
CREATE POLICY "wf_reviewer_update" ON public.workflow_items FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]));
CREATE POLICY "wf_admin_delete" ON public.workflow_items FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]));

-- AUDIT EVENTS: append-only — SELECT + INSERT only, no UPDATE/DELETE policies
CREATE POLICY "audit_member_select" ON public.audit_events FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id));
CREATE POLICY "audit_member_insert" ON public.audit_events FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IS NOT NULL
    AND public.is_org_member(organization_id)
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- CLIENT PORTALS
CREATE POLICY "portals_member_select" ON public.client_portals FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "portals_admin_insert" ON public.client_portals FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]));
CREATE POLICY "portals_admin_update" ON public.client_portals FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]));
CREATE POLICY "portals_admin_delete" ON public.client_portals FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]));

-- PUBLISHED ARTIFACTS
CREATE POLICY "pub_member_select" ON public.published_artifacts FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "pub_admin_insert" ON public.published_artifacts FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin','reviewer']::org_role[]) AND user_id = auth.uid());
CREATE POLICY "pub_admin_delete" ON public.published_artifacts FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]));

-- ONE-TIME PURCHASES: user sees own; org admins see org's
CREATE POLICY "otp_self_select" ON public.one_time_purchases FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (organization_id IS NOT NULL AND public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[])));

-- SIGNAL CACHE: read-only for all authenticated; writes via service role only (no insert/update/delete policies)
CREATE POLICY "sig_read_all" ON public.signal_cache FOR SELECT TO authenticated USING (true);

-- LOGOS SETTINGS: Pantheon-only, admin-managed
CREATE POLICY "logos_pantheon_select" ON public.logos_settings FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) AND public.has_pantheon_plan(organization_id));
CREATE POLICY "logos_pantheon_insert" ON public.logos_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]) AND public.has_pantheon_plan(organization_id));
CREATE POLICY "logos_pantheon_update" ON public.logos_settings FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]) AND public.has_pantheon_plan(organization_id))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]) AND public.has_pantheon_plan(organization_id));
CREATE POLICY "logos_pantheon_delete" ON public.logos_settings FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['owner','admin']::org_role[]));

-- =====================================================================
-- SEED PLANS
-- =====================================================================
INSERT INTO public.plans (name, monthly_price_cents, features) VALUES
  ('free',         0,     '{"tier":"free"}'),
  ('sunesis',     14900,  '{"tier":"sunesis"}'),
  ('aion',        19900,  '{"tier":"aion","includes":["sunesis"]}'),
  ('kyrios',      29900,  '{"tier":"kyrios","includes":["sunesis","aion"]}'),
  ('phaos_one',   59900,  '{"tier":"phaos_one","flagship":true,"includes":["sunesis","aion","kyrios"]}'),
  ('pantheon',    99900,  '{"tier":"pantheon","seats":5,"includes":["phaos_one"],"logos_engine":true}')
ON CONFLICT (name) DO NOTHING;
