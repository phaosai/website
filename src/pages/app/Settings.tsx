import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const PLATFORMS = ["Robinhood", "Fidelity", "Schwab", "E*TRADE", "Thinkorswim", "All Others Publicly Available", "Other"];

export default function Settings() {
  const { user } = useAuth();
  const [platform, setPlatform] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("platform_preferences").select("preferred_platform").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setPlatform(data?.preferred_platform ?? ""));
  }, [user]);

  const save = async (p: string) => {
    if (!user) return;
    setSaving(true);
    await supabase.from("platform_preferences").upsert({ user_id: user.id, preferred_platform: p as any });
    setPlatform(p);
    setSaving(false);
  };

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Account and platform preferences.</p>
      </header>

      <section className="rounded-xl border border-border bg-card/50 p-5">
        <p className="text-sm font-semibold">Account</p>
        <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
      </section>

      <section className="rounded-xl border border-border bg-card/50 p-5">
        <p className="text-sm font-semibold">Preferred trading platform</p>
        <p className="text-xs text-muted-foreground mt-1">Used to tailor your research surfaces.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={platform === p ? "default" : "outline"}
              disabled={saving}
              onClick={() => save(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
