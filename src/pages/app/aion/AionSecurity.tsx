import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/app/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AionSecurity() {
  const { user } = useAuth();

  const signOutAll = async () => {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) return toast.error(error.message);
    toast.success("Signed out of all devices");
  };

  return (
    <PageShell title="Security Center" description="Sessions, devices, and privacy controls." minTier="aion">
      <section className="rounded-xl border border-border bg-card/50 p-5 space-y-2">
        <h2 className="text-sm font-semibold">Current session</h2>
        <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
      </section>

      <section className="rounded-xl border border-border bg-card/50 p-5 space-y-3">
        <h2 className="text-sm font-semibold">Active devices</h2>
        <p className="text-sm text-muted-foreground">Sign out of every device this account is currently authenticated on.</p>
        <Button variant="outline" onClick={signOutAll}>Revoke all sessions</Button>
      </section>

      <section className="rounded-xl border border-border bg-card/50 p-5 space-y-2">
        <h2 className="text-sm font-semibold">Privacy vault</h2>
        <p className="text-sm text-muted-foreground">Status: <span className="text-emerald-500">Active</span></p>
        <p className="text-xs text-muted-foreground">Secrets are encrypted at rest in Lovable Cloud Vault and only accessed by audited edge functions.</p>
      </section>

      <section className="rounded-xl border border-border bg-card/50 p-5">
        <h2 className="text-sm font-semibold">Data retention</h2>
        <p className="text-sm text-muted-foreground mt-1">Audit logs retained 7 years. Research artifacts retained for the lifetime of your account.</p>
      </section>
    </PageShell>
  );
}
