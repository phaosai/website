import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AppDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error || !data?.url) {
      toast({ title: "Portal unavailable", description: error?.message || "No active subscription found.", variant: "destructive" });
      return;
    }
    window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-16">
      <SEOHead title="Workspace — Phaos AI" description="Your Phaos AI workspace." canonical="/app" />
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
            <p className="text-sm text-muted-foreground mt-1">Signed in as {user?.email}</p>
          </div>
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        </header>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/one/run-simulation" className="rounded-xl border border-border bg-card/50 p-5 hover:bg-card transition-colors">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Sandbox</p>
            <p className="text-lg font-semibold mt-1">Run a Simulation</p>
            <p className="text-sm text-muted-foreground mt-2">Stress-test a ticker against a scenario. SIMULATED outputs only.</p>
          </Link>
          <Link to="/pricing" className="rounded-xl border border-border bg-card/50 p-5 hover:bg-card transition-colors">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Plans</p>
            <p className="text-lg font-semibold mt-1">Upgrade or change plan</p>
            <p className="text-sm text-muted-foreground mt-2">Sunesis, Aion, Kyrios, Phaos ONE, Pantheon.</p>
          </Link>
          <button onClick={openPortal} className="text-left rounded-xl border border-border bg-card/50 p-5 hover:bg-card transition-colors">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Billing</p>
            <p className="text-lg font-semibold mt-1">Manage subscription</p>
            <p className="text-sm text-muted-foreground mt-2">Update payment method, invoices, cancel.</p>
          </button>
          <Link to="/contact" className="rounded-xl border border-border bg-card/50 p-5 hover:bg-card transition-colors">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Support</p>
            <p className="text-lg font-semibold mt-1">Talk to a researcher</p>
            <p className="text-sm text-muted-foreground mt-2">Schedule a Call with our team.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AppDashboard;
