import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast({ title: "Could not update password", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated", description: "You're signed in." });
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <SEOHead title="Set new password — Phaos AI" description="Choose a new password for your Phaos AI workspace account. Use a strong, unique password to keep your data secure." canonical="/auth/reset-password" noIndex />
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/50 p-8 space-y-5">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <form onSubmit={submit} className="space-y-3">
          <Input type="password" placeholder="New password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <Button type="submit" className="w-full" disabled={busy}>Update password</Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
