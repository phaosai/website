import { useEffect, useState } from "react";
import { Bell, Lock, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type TierMode = "elite" | "pro" | "sovereign";

interface Props { tierMode: TierMode }

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "M" },
  { key: "tue", label: "T" },
  { key: "wed", label: "W" },
  { key: "thu", label: "T" },
  { key: "fri", label: "F" },
  { key: "sat", label: "Sa" },
  { key: "sun", label: "Su" },
];

const TIMEZONES = [
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Phoenix",
  "America/Chicago",
  "America/New_York",
  "America/Halifax",
  "America/Sao_Paulo",
  "Atlantic/Azores",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Athens",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Perth",
  "Australia/Sydney",
  "Pacific/Auckland",
];

interface CustomConfig {
  same_time: boolean;
  same_time_value: string;
  days: Record<DayKey, { enabled: boolean; time: string }>;
}

interface ScheduleConfig {
  timezone: string;
  daily_time: string;
  weekly: { day: number; time: string }; // 0=Sun..6=Sat
  custom: CustomConfig;
}

interface Schedule {
  channels: { email: boolean; sms: boolean; save: boolean };
  frequency: "daily" | "weekly" | "custom";
  config: ScheduleConfig;
  quantum_enabled: boolean;
  auto_replenish: boolean;
  phone_e164: string | null;
}

const defaultConfig = (): ScheduleConfig => ({
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  daily_time: "09:00",
  weekly: { day: 1, time: "09:00" },
  custom: {
    same_time: true,
    same_time_value: "09:00",
    days: DAYS.reduce((acc, d) => {
      acc[d.key] = { enabled: false, time: "09:00" };
      return acc;
    }, {} as CustomConfig["days"]),
  },
});

const DEFAULTS: Schedule = {
  channels: { email: false, sms: false, save: false },
  frequency: "daily",
  config: defaultConfig(),
  quantum_enabled: false,
  auto_replenish: false,
  phone_e164: null,
};

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
        const ch = (data.channels as Record<string, boolean>) ?? {};
        const raw = data.custom_slots as unknown;
        let config = defaultConfig();
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          const incoming = raw as Partial<ScheduleConfig>;
          config = {
            ...config,
            ...incoming,
            weekly: { ...config.weekly, ...(incoming.weekly ?? {}) },
            custom: {
              ...config.custom,
              ...(incoming.custom ?? {}),
              days: { ...config.custom.days, ...((incoming.custom?.days) ?? {}) },
            },
          };
        }
        setS({
          channels: { email: !!ch.email, sms: !!ch.sms, save: !!(ch.save ?? ch.push) },
          frequency: data.frequency as Schedule["frequency"],
          config,
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
      custom_slots: s.config as unknown as never,
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
      toast.error("Quantum auto-alerts require Sovereign");
      return;
    }
    setS({ ...s, quantum_enabled: next });
  };

  const updateCfg = (patch: Partial<ScheduleConfig>) =>
    setS({ ...s, config: { ...s.config, ...patch } });

  const updateCustom = (patch: Partial<CustomConfig>) =>
    setS({ ...s, config: { ...s.config, custom: { ...s.config.custom, ...patch } } });

  const toggleDay = (key: DayKey, enabled: boolean) => {
    const days = { ...s.config.custom.days, [key]: { ...s.config.custom.days[key], enabled } };
    updateCustom({ days });
  };

  const setDayTime = (key: DayKey, time: string) => {
    const days = { ...s.config.custom.days, [key]: { ...s.config.custom.days[key], time } };
    updateCustom({ days });
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
            <Switch checked={s.channels.save} onCheckedChange={(v) => setS({ ...s, channels: { ...s.channels, save: v } })} />
            Save
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

      {/* Timezone */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Time zone</p>
        <select
          value={s.config.timezone}
          onChange={(e) => updateCfg({ timezone: e.target.value })}
          className="w-full max-w-xs rounded-md border border-border bg-background/60 px-3 py-2 text-sm"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Frequency */}
      <div className="space-y-3">
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

        {s.frequency === "daily" && (
          <div className="flex items-center gap-2 pt-1">
            <label className="text-xs text-muted-foreground">Time</label>
            <input
              type="time"
              value={s.config.daily_time}
              onChange={(e) => updateCfg({ daily_time: e.target.value })}
              className="rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm font-mono"
            />
          </div>
        )}

        {s.frequency === "weekly" && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <label className="text-xs text-muted-foreground">Day</label>
            <select
              value={s.config.weekly.day}
              onChange={(e) => updateCfg({ weekly: { ...s.config.weekly, day: Number(e.target.value) } })}
              className="rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm"
            >
              {WEEKDAY_NAMES.map((name, i) => <option key={i} value={i}>{name}</option>)}
            </select>
            <label className="text-xs text-muted-foreground ml-2">Time</label>
            <input
              type="time"
              value={s.config.weekly.time}
              onChange={(e) => updateCfg({ weekly: { ...s.config.weekly, time: e.target.value } })}
              className="rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm font-mono"
            />
          </div>
        )}

        {s.frequency === "custom" && (
          <div className="space-y-3 pt-1">
            <label className="inline-flex items-center gap-2 text-xs">
              <Checkbox
                checked={s.config.custom.same_time}
                onCheckedChange={(v) => updateCustom({ same_time: !!v })}
              />
              Same time for every selected day
            </label>
            {s.config.custom.same_time && (
              <input
                type="time"
                value={s.config.custom.same_time_value}
                onChange={(e) => updateCustom({ same_time_value: e.target.value })}
                className="rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm font-mono block"
              />
            )}
            <div className="space-y-2">
              {DAYS.map((d) => {
                const cfg = s.config.custom.days[d.key];
                return (
                  <div key={d.key} className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 w-20">
                      <Checkbox
                        checked={cfg.enabled}
                        onCheckedChange={(v) => toggleDay(d.key, !!v)}
                      />
                      <span className="text-sm font-semibold">{d.label}</span>
                    </label>
                    {!s.config.custom.same_time && (
                      <input
                        type="time"
                        disabled={!cfg.enabled}
                        value={cfg.time}
                        onChange={(e) => setDayTime(d.key, e.target.value)}
                        className="rounded-md border border-border bg-background/60 px-3 py-1 text-sm font-mono disabled:opacity-40"
                      />
                    )}
                  </div>
                );
              })}
            </div>
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
