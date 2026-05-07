import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";

const PLATFORMS = ["Robinhood", "Fidelity", "Schwab", "E*TRADE", "Thinkorswim", "All Others Publicly Available", "Other"];

const COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" }, { code: "CA", name: "Canada" }, { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" }, { code: "DE", name: "Germany" }, { code: "FR", name: "France" },
  { code: "ES", name: "Spain" }, { code: "IT", name: "Italy" }, { code: "PT", name: "Portugal" },
  { code: "NL", name: "Netherlands" }, { code: "BE", name: "Belgium" }, { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" }, { code: "SE", name: "Sweden" }, { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" }, { code: "FI", name: "Finland" }, { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" }, { code: "GR", name: "Greece" }, { code: "TR", name: "Türkiye" },
  { code: "IL", name: "Israel" }, { code: "AE", name: "United Arab Emirates" }, { code: "SA", name: "Saudi Arabia" },
  { code: "ZA", name: "South Africa" }, { code: "NG", name: "Nigeria" }, { code: "KE", name: "Kenya" },
  { code: "EG", name: "Egypt" }, { code: "MX", name: "Mexico" }, { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" }, { code: "CL", name: "Chile" }, { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" }, { code: "JP", name: "Japan" }, { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" }, { code: "HK", name: "Hong Kong" }, { code: "TW", name: "Taiwan" },
  { code: "SG", name: "Singapore" }, { code: "MY", name: "Malaysia" }, { code: "TH", name: "Thailand" },
  { code: "ID", name: "Indonesia" }, { code: "PH", name: "Philippines" }, { code: "VN", name: "Vietnam" },
  { code: "IN", name: "India" }, { code: "PK", name: "Pakistan" }, { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
];

export default function Settings() {
  const { user } = useAuth();
  const [platform, setPlatform] = useState<string>("");
  const [savingPlatform, setSavingPlatform] = useState(false);

  const [country, setCountry] = useState<string>("");
  const [handle, setHandle] = useState<string>("");
  const [handleIsPublic, setHandleIsPublic] = useState<boolean>(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("platform_preferences").select("preferred_platform").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setPlatform(data?.preferred_platform ?? ""));
    supabase.from("users").select("country_code,public_handle,handle_is_public").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setCountry((data as any)?.country_code ?? "");
        setHandle((data as any)?.public_handle ?? "");
        setHandleIsPublic(!!(data as any)?.handle_is_public);
      });
  }, [user]);

  const savePlatform = async (p: string) => {
    if (!user) return;
    setSavingPlatform(true);
    await supabase.from("platform_preferences").upsert({ user_id: user.id, preferred_platform: p as any });
    setPlatform(p);
    setSavingPlatform(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("users").update({
      country_code: country || null,
      public_handle: handle || null,
      handle_is_public: handleIsPublic,
    }).eq("id", user.id);
    setSavingProfile(false);
    if (error) toast.error("Couldn't save profile: " + error.message);
    else toast.success("Profile updated");
  };

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Account, profile, and platform preferences.</p>
      </header>

      <section className="rounded-xl border border-border bg-card/50 p-5">
        <p className="text-sm font-semibold">Account</p>
        <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
        <p className="text-[11px] text-muted-foreground mt-1">Used for leaderboard notifications and alerts delivery.</p>
      </section>

      <section className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold">Public profile</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your country feeds the leaderboard and alerts personalization. Public handle is only shown if you opt in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select…</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="handle">Public handle</Label>
            <Input
              id="handle"
              value={handle}
              maxLength={32}
              placeholder="e.g. quant_owl"
              onChange={(e) => setHandle(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">Profanity is auto-masked.</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2">
          <div>
            <p className="text-sm font-medium">Show my handle on public leaderboards</p>
            <p className="text-[11px] text-muted-foreground">When off, you appear as "Anonymous". Country flag still shows.</p>
          </div>
          <Switch checked={handleIsPublic} onCheckedChange={setHandleIsPublic} />
        </div>

        <Button onClick={saveProfile} disabled={savingProfile} size="sm">
          {savingProfile ? "Saving…" : "Save profile"}
        </Button>
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
              disabled={savingPlatform}
              onClick={() => savePlatform(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
