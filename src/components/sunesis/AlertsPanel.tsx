import { useEffect, useState } from "react";
import { Bell, Lock, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type TierMode = "elite" | "pro" | "sovereign";

interface Props { tierMode: TierMode }

interface Schedule {
  channels: { email: boolean; sms: boolean; push: boolean };
  frequency: "daily" | "weekly" | "custom";
  custom_slots: string[];
  quantum_enabled: boolean;
  auto_replenish: boolean;
  phone_e164: string | null;
}

const DEFAULTS: Schedule = {
  channels: { email: true, sms: false, push: false },
  frequency: "daily",
  custom_slots: [],
  quantum_enabled: false,
  auto_replenish: false,
  phone_e164: null,
};

export function AlertsPanel({ tierMode }: Props) {
  const [s, setS] = useState<Schedule>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }
      const { data } = await supabase.from("alert_schedules").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setS({
          channels: data.channels as Schedule["channels"],
          frequency: data.frequency as Schedule["frequency"],
          custom_slots: (data.custom_slots as string[]) ?? [],
          quantum_enabled: data.quantum_enabled,
          auto_replenish: data.auto_replenish,
          phone_e164: data.phone_e164,
        });
      }
      setLoaded(true);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sign in to save alerts"); setSaving(false); return; }
    const { error } = await supabase.from("alert_schedules").upsert({
      user_id: user.id,
      channels: s.channels,
      frequency: s.frequency,
      custom_slots: s.custom_slots,
      quantum_enabled: s.quantum_enabled && tierMode === "sovereign",
      auto_replenish: s.auto_replenish && tierMode === "sovereign",
      phone_e164: s.phone_e164,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Alert schedule saved");
  };

  const tryQuantum = (next: boolean) => {
    if (tierMode !== "sovereign") {
      toast.error("Quantum auto-alerts require Sovereign", {
        description: tierMode === "elite" ? "Upgrade to Sovereign to enable automated quantum alerts." : "Pro tier cannot enable quantum auto-alerts. Upgrade to Sovereign.",
      });
      return;
    }
    setS({ ...s, quantum_enabled: next });
  };

  const slotInput = (idx: number, val: string) => {
    const next = [...s.custom_slots];
    next[idx] = val;
    setS({ ...s, custom_slots: next });
  };

  if (!loaded) return null;

  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-deep" />
          <p className="text-sm font-semibold">Set alerts</p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{tierMode}</Badge>
      </div>

      {/* Channels */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Delivery channels</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <Switch checked={s.channels.email} onCheckedChange={(v) => setS({ ...s, channels: { ...s.channels, email: v } })} />
            Email
          </label>
          <label className="inline-flex items-center gap-2">
            <Switch checked={s.channels.sms} onCheckedChange={(v) => setS({ ...s, channels: { ...s.channels, sms: v } })} />
            SMS
          </label>
          <label className="inline-flex items-center gap-2">
            <Switch checked={s.channels.push} onCheckedChange={(v) => setS({ ...s, channels: { ...s.channels, push: v } })} />
            Push
          </label>
        </div>
        {s.channels.sms && (
          <input
            type="tel"
            placeholder="+15558675310"
            value={s.phone_e164 ?? ""}
            onChange={(e) => setS({ ...s, phone_e164: e.target.value })}
            className="w-full max-w-xs rounded-md border border-border bg-background/60 px-3 py-2 text-sm font-mono"
          />
        )}
      </div>

      {/* Frequency */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Frequency</p>
        <div className="flex flex-wrap gap-2">
          {(["daily", "weekly", "custom"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setS({ ...s, frequency: f })}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${s.frequency === f ? "border-primary bg-primary/15 text-primary" : "border-border bg-background/60 text-muted-foreground hover:bg-card"}`}
            >{f}</button>
          ))}
        </div>
        {s.frequency === "custom" && (
          <div className="flex flex-wrap gap-2 pt-2">
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                type="time"
                value={s.custom_slots[i] ?? ""}
                onChange={(e) => slotInput(i, e.target.value)}
                className="rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm font-mono"
              />
            ))}
          </div>
        )}
      </div>

      {/* Quantum auto-alerts */}
      <div className={`rounded-lg border p-4 space-y-3 ${tierMode === "sovereign" ? "border-pci-choice/30 bg-pci-choice/5" : "border-border bg-muted/20"}`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {tierMode === "sovereign" ? <Zap className="w-4 h-4 text-pci-choice" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
            <p className="text-sm font-semibold">Quantum auto-alerts</p>
            <Badge variant="outline" className="border-pci-choice/50 bg-pci-choice/10 text-pci-choice text-[10px] uppercase tracking-wider">Sovereign</Badge>
          </div>
          <Switch
            checked={s.quantum_enabled}
            disabled={tierMode !== "sovereign"}
            onCheckedChange={tryQuantum}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Run a real IBM Quantum cross-correlation pass automatically per alert cycle (max 1 instance/day included). Additional runs billed via automatic replenishment.
        </p>
        {tierMode === "sovereign" && s.quantum_enabled && (
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={s.auto_replenish} onCheckedChange={(v) => setS({ ...s, auto_replenish: v })} />
            Authorize automatic quantum replenishment billing
          </label>
        )}
        {tierMode !== "sovereign" && (
          <p className="text-[11px] text-muted-foreground italic">
            {tierMode === "elite"
              ? "Greyed out on Elite. Upgrade to Sovereign to enable."
              : "Pro cannot enable quantum auto-alerts. Upgrade to Sovereign."}
          </p>
        )}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-primary bg-primary/15 text-primary px-5 py-2 text-sm font-semibold hover:bg-primary/25 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save alert schedule"}
      </button>
    </div>
  );
}
