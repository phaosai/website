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
import phaosCrown from "@/assets/phaos-crown-transparent.png";

type Mode = "signup" | "signin";

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

  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate(from, { replace: true });
  }, [session, loading, from, navigate]);

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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "Confirm your email to finish signing up." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "#0b0b0f" }}>
      <SEOHead title="Sign in — Phaos AI" description="Sign in to your Phaos AI workspace." canonical="/auth" />

      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <img
            src={phaosCrown}
            alt="Phaos AI"
            width={140}
            height={90}
            className="w-[110px] h-auto drop-shadow-[0_0_30px_rgba(138,43,226,0.45)]"
          />
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
            <span className="text-white">PHAOS</span>{" "}
            <span className="italic font-semibold bg-gradient-to-r from-[#B97AFF] to-[#8A2BE2] bg-clip-text text-transparent">
              AI
            </span>
          </h1>
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
                onClick={() => setMode(m)}
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
                {m === "signup" ? "Create Account" : "Sign In"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold tracking-[0.2em] text-white/55">EMAIL</label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[rgba(255,255,255,0.04)] border-[rgba(138,43,226,0.2)] text-white placeholder:text-white/30 h-11"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold tracking-[0.2em] text-white/55">PASSWORD</label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[rgba(255,255,255,0.04)] border-[rgba(138,43,226,0.2)] text-white pr-10 h-11"
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
                    className="bg-[rgba(255,255,255,0.04)] border-[rgba(138,43,226,0.2)] text-white pr-10 h-11"
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
    </div>
  );
};

export default Auth;
