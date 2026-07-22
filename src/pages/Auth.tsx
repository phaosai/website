import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import phaosCrown from "@/assets/phaos-crown-transparent.png";

type Mode = "signup" | "signin";

const planNames: Record<string, string> = {
  sunesis_monthly: "Phaos Sunesis",
  aion_monthly: "Phaos Pro",
  kyrios_monthly: "Phaos Elite",
  phaos_one_monthly: "Phaos Research",
};

const passwordRules = (pw: string) => ({
  length: pw.length >= 10,
  lower: /[a-z]/.test(pw),
  upper: /[A-Z]/.test(pw),
  number: /\d/.test(pw),
  special: /[^A-Za-z0-9]/.test(pw),
});

const Auth = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const from = (location.state as { from?: string } | null)?.from || "/app";
  const selectedPlan = new URLSearchParams(location.search).get("plan") || "";
  const portal = (new URLSearchParams(location.search).get("portal") || "").toLowerCase();
  const isVoicePortal = portal === "voice";
  const portalLabel =
    portal === "workflow" ? "Workflow" : portal === "research" ? "Research" : portal === "voice" ? "Voice" : "";
  const selectedPlanName = planNames[selectedPlan] || "your plan";
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const VOICE_CONTACT_URL = "https://voice.phaosai.com/contact";
  const VOICE_APP_ORIGIN = "https://voice.phaosai.com";

  const handoffVoiceSession = (s: {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    expires_at?: number;
    token_type?: string;
  }) => {
    const hash = new URLSearchParams({
      access_token: s.access_token,
      refresh_token: s.refresh_token,
      expires_in: String(s.expires_in ?? 3600),
      expires_at: String(s.expires_at ?? Math.floor(Date.now() / 1000) + (s.expires_in ?? 3600)),
      token_type: s.token_type ?? "bearer",
      type: "magiclink",
    });
    window.location.replace(`${VOICE_APP_ORIGIN}/#${hash.toString()}`);
  };

  // Portal entry points (Voice / Research / Workflow) default to Sign In.
  // Voice "Sign Up" is a redirect to the Voice contact form — not an in-app signup.
  const [mode, setMode] = useState<Mode>(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "signup" && portal !== "voice") return "signup";
    if (params.get("mode") === "signin" || portal) return "signin";
    return "signup";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkoutStarted, setCheckoutStarted] = useState(false);

  useEffect(() => {
    if (loading || !session) return;
    // Voice Live Accounts continue on voice.phaosai.com (shared Supabase project).
    if (isVoicePortal) {
      handoffVoiceSession(session);
      return;
    }
    if (!selectedPlan) {
      navigate(from, { replace: true });
      return;
    }
    if (!checkoutStarted) {
      setCheckoutStarted(true);
      openCheckout({
        priceId: selectedPlan,
        customerEmail: session.user.email,
        userId: session.user.id,
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      });
    }
  }, [checkoutStarted, from, isVoicePortal, loading, navigate, openCheckout, selectedPlan, session]);

  const rules = useMemo(() => passwordRules(password), [password]);
  const passedRules = Object.values(rules).filter(Boolean).length;
  const strengthLabel =
    passedRules <= 1 ? "Too weak" : passedRules <= 3 ? "Fair" : passedRules === 4 ? "Strong" : "Excellent";
  const strengthColor =
    passedRules <= 1
      ? "bg-red-500"
      : passedRules <= 3
        ? "bg-yellow-500"
        : passedRules === 4
          ? "bg-emerald-500"
          : "bg-emerald-400";
  const allRulesMet = passedRules === 5;
  const confirmMatches = confirm.length > 0 && confirm === password;
  const canSubmitSignup = email && allRulesMet && confirmMatches;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!canSubmitSignup) throw new Error("Please satisfy all password requirements.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) throw error;
        toast({
          title: data.session ? "Account created" : "Check your email",
          description: data.session
            ? `Opening checkout for ${selectedPlanName}.`
            : selectedPlan
              ? "Confirm your email, then sign in here to finish checkout."
              : "Confirm your email to finish signing up.",
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) throw error;
        if (!data.session) throw new Error("Sign in succeeded but the session was not restored. Please try again.");
        if (isVoicePortal) {
          toast({ title: "Signed in", description: "Opening your Voice Live Account." });
          handoffVoiceSession(data.session);
          return;
        }
        toast({ title: "Signed in", description: "Opening your Phaos workspace." });
        navigate(selectedPlan ? "/app/billing" : from, { replace: true });
      }
    } catch (err) {
      toast({ title: "Authentication failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const Rule = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-[13px] text-white/70">
      {ok ? (
        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
      ) : (
        <X className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
      )}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <SEOHead title="Sign in — Phaos AI" description="Sign in to your Phaos AI workspace to access Voice AI agents, agentic workflows, and Sunesis research tools." canonical="/auth" noIndex />

      <div className="w-full max-w-md space-y-8">
        {/* Logo — crown mark + HTML wordmark (never a raster "PHAOS AI" image) */}
        <div className="flex flex-col items-center pt-2">
          <img
            src={phaosCrown}
            alt=""
            aria-hidden="true"
            width={200}
            height={130}
            decoding="async"
            className="w-[150px] h-auto drop-shadow-[0_0_35px_rgba(138,43,226,0.45)]"
          />
          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-[0.06em] leading-none whitespace-nowrap px-2 antialiased">
            <span className="text-white">PHAOS</span>
            <span className="italic font-semibold bg-gradient-to-r from-[#B97AFF] to-[#8A2BE2] bg-clip-text text-transparent">
              {"\u00A0"}AI
            </span>
          </h1>
          {isVoicePortal && (
            <span className="sr-only">Sign in to Phaos Voice</span>
          )}
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 sm:p-8 space-y-6"
          style={{
            background: "rgba(20,18,30,0.85)",
            border: "1px solid rgba(138,43,226,0.18)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          {/* Tabs */}
          <div className="grid grid-cols-2 rounded-full p-1" style={{ background: "rgba(255,255,255,0.04)" }}>
            {(["signup", "signin"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  if (m === "signup" && isVoicePortal) {
                    window.location.assign(VOICE_CONTACT_URL);
                    return;
                  }
                  setMode(m);
                }}
                className="py-2.5 text-sm font-semibold rounded-full transition-all"
                style={
                  mode === m
                    ? {
                        background: "linear-gradient(135deg, #8A2BE2, #6B21A8)",
                        color: "#fff",
                        boxShadow: "0 0 20px rgba(138,43,226,0.4)",
                      }
                    : { color: "rgba(255,255,255,0.55)" }
                }
              >
                {m === "signup" ? (isVoicePortal ? "Sign Up" : "Create Account") : "Sign In"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {portalLabel && !selectedPlan && (
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Signing in to</p>
                <p className="mt-1 text-sm font-semibold text-white">Phaos {portalLabel}</p>
              </div>
            )}
            {selectedPlan && (
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Selected plan</p>
                <p className="mt-1 text-sm font-semibold text-white">{selectedPlanName}</p>
                <p className="mt-1 text-xs text-white/55">Create your account, then secure checkout opens automatically.</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="auth-email" className="text-[11px] font-bold tracking-[0.2em] text-white/55">EMAIL</label>
              <Input
                id="auth-email"
                name="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
                className="bg-[rgba(255,255,255,0.04)] border-[rgba(138,43,226,0.2)] text-white placeholder:text-white/30 h-11 text-base"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="auth-password" className="text-[11px] font-bold tracking-[0.2em] text-white/55">PASSWORD</label>
              <div className="relative">
                <Input
                  id="auth-password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="bg-[rgba(255,255,255,0.04)] border-[rgba(138,43,226,0.2)] text-white pr-10 h-11 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Strength meter — only on signup */}
            {mode === "signup" && (
              <div className="space-y-3">
                <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full ${strengthColor} transition-all`}
                    style={{ width: `${(passedRules / 5) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold tracking-[0.2em]">
                  <span className="text-white/55">STRENGTH</span>
                  <span
                    className={
                      passedRules <= 1
                        ? "text-red-400"
                        : passedRules <= 3
                          ? "text-yellow-400"
                          : "text-emerald-400"
                    }
                  >
                    {strengthLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <Rule ok={rules.length} label="At least 10 characters" />
                  <Rule ok={rules.upper} label="One uppercase letter" />
                  <Rule ok={rules.lower} label="One lowercase letter" />
                  <Rule ok={rules.number} label="One number" />
                  <Rule ok={rules.special} label="One special character" />
                </div>
              </div>
            )}

            {/* Confirm password — signup only */}
            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-[0.2em] text-white/55">CONFIRM PASSWORD</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="bg-[rgba(255,255,255,0.04)] border-[rgba(138,43,226,0.2)] text-white pr-10 h-11 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirm.length > 0 && !confirmMatches && (
                  <p className="text-xs text-red-400">Passwords don't match</p>
                )}
              </div>
            )}

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(!!v)}
                className="border-white/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              <label htmlFor="remember" className="text-sm text-white/75 cursor-pointer">
                Remember me on this device
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={busy || (mode === "signup" && !canSubmitSignup)}
              className="w-full h-12 text-base font-semibold rounded-xl text-white border-0 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #8A2BE2, #6B21A8)",
                boxShadow: "0 0 25px rgba(138,43,226,0.35)",
              }}
            >
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "signup" ? "Create Account" : "Sign In"}
            </Button>

            {/* Centered forgot password */}
            <div className="text-center">
              <Link to="/auth/forgot-password" className="text-sm text-white/70 hover:text-white transition-colors">
                Reset Your Password
              </Link>
            </div>
          </form>
        </div>

        <p className="text-[11px] text-center text-white/40">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="underline hover:text-white/70">Terms</Link> and{" "}
          <Link to="/privacy" className="underline hover:text-white/70">Privacy Policy</Link>.
        </p>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
            <button
              onClick={closeCheckout}
              className="absolute right-4 top-4 z-10 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-muted"
              aria-label="Close checkout"
            >
              Close
            </button>
            <div className="p-6 pt-14">{checkoutElement}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
