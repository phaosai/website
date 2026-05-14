import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Could not send reset email", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <SEOHead title="Reset password — Phaos AI" description="Reset your Phaos AI password." canonical="/auth/forgot-password" />
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/50 p-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-1">We'll email you a secure link.</p>
        </div>
        {sent ? (
          <p className="text-sm text-foreground/85">If an account exists for {email}, a reset link is on its way.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Input type="email" placeholder="you@firm.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={busy}>Send reset link</Button>
          </form>
        )}
        <Link to="/auth" className="text-xs text-primary hover:underline">← Back to sign in</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
