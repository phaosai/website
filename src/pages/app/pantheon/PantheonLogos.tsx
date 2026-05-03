import { useEffect, useState } from "react";
import { PageShell } from "@/components/app/PageShell";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Crown } from "lucide-react";

interface LogosRow {
  id?: string;
  organization_id: string;
  firm_name: string | null;
  logo_url: string | null;
  accent_color: string | null;
  apply_to_memos: boolean;
  apply_to_portals: boolean;
}

export default function PantheonLogos() {
  const { organizationId, role } = useOrganization();
  const isAdmin = role === "owner" || role === "admin";
  const [row, setRow] = useState<LogosRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [applyToReports, setApplyToReports] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    (async () => {
      const { data } = await supabase
        .from("logos_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();
      setRow(data ?? {
        organization_id: organizationId,
        firm_name: "", logo_url: null, accent_color: "#7c3aed",
        apply_to_memos: true, apply_to_portals: true,
      });
    })();
  }, [organizationId]);

  const update = (patch: Partial<LogosRow>) => setRow((r) => r ? { ...r, ...patch } : r);

  const upload = async (file: File) => {
    if (!organizationId) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    const ext = file.name.split(".").pop();
    const path = `${organizationId}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    update({ logo_url: data.publicUrl });
    toast.success("Logo uploaded");
  };

  const save = async () => {
    if (!row || !organizationId) return;
    setSaving(true);
    const payload = {
      organization_id: organizationId,
      firm_name: row.firm_name,
      logo_url: row.logo_url,
      accent_color: row.accent_color,
      apply_to_memos: row.apply_to_memos,
      apply_to_portals: row.apply_to_portals,
    };
    const { error } = row.id
      ? await supabase.from("logos_settings").update(payload).eq("id", row.id)
      : await supabase.from("logos_settings").insert(payload);
    if (error) toast.error(error.message);
    else toast.success("Branding saved");
    setSaving(false);
  };

  if (!row) return <PageShell title="Logos" minTier="pantheon">Loading…</PageShell>;

  return (
    <PageShell title="Logos — White-label branding" minTier="pantheon">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Logos allows your firm to present research outputs under your own brand — Truth Memos,
        research reports, and client portals appear with your firm's identity, not Phaos AI's.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-border p-5 space-y-4">
          <h3 className="font-semibold">Settings</h3>
          <div className="space-y-1.5">
            <Label>Firm display name</Label>
            <Input value={row.firm_name ?? ""} onChange={(e) => update({ firm_name: e.target.value })} disabled={!isAdmin} />
          </div>
          <div className="space-y-1.5">
            <Label>Logo (PNG/SVG, max 2MB)</Label>
            <Input type="file" accept=".png,.svg,image/png,image/svg+xml"
              disabled={!isAdmin}
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            {row.logo_url && (
              <img src={row.logo_url} alt="firm logo" className="mt-2 max-h-16 bg-muted/30 rounded p-2" />
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Accent color</Label>
            <Input type="color" value={row.accent_color ?? "#7c3aed"} className="h-10 w-20"
              onChange={(e) => update({ accent_color: e.target.value })} disabled={!isAdmin} />
          </div>
          <div className="space-y-3 pt-2">
            <ToggleRow label="Apply to Truth Memos" checked={row.apply_to_memos}
              onChange={(v) => update({ apply_to_memos: v })} disabled={!isAdmin} />
            <ToggleRow label="Apply to Client Portals" checked={row.apply_to_portals}
              onChange={(v) => update({ apply_to_portals: v })} disabled={!isAdmin} />
            <ToggleRow label="Apply to Published Reports" checked={applyToReports}
              onChange={setApplyToReports} disabled={!isAdmin} />
          </div>
          {isAdmin && (
            <Button onClick={save} disabled={saving} className="w-full">{saving ? "Saving…" : "Save branding"}</Button>
          )}
        </section>

        <section className="rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-3">Preview — Truth Memo</h3>
          <div className="rounded-lg border border-border bg-background p-5">
            <header className="flex items-center justify-between border-b border-border pb-3 mb-3"
              style={{ borderColor: row.accent_color ?? undefined }}>
              <div className="flex items-center gap-2">
                {row.logo_url ? (
                  <img src={row.logo_url} alt="" className="h-8" />
                ) : (
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                    <Crown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <span className="font-semibold">{row.firm_name || "Your Firm"}</span>
              </div>
              <span className="text-xs text-muted-foreground">Truth Memo · Sample</span>
            </header>
            <h4 className="text-lg font-bold" style={{ color: row.accent_color ?? undefined }}>
              AAPL — Constructive (PCI 67)
            </h4>
            <p className="text-sm text-muted-foreground mt-2">
              Bull case driven by services margin expansion. Bear case anchored on China demand softness.
              <span className="block mt-2 text-[10px] uppercase tracking-wide">Historical example · simulated output</span>
            </p>
          </div>
        </section>
      </div>

      <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-3">
        Logos branding applies to research output documents and client portals. The Phaos AI application
        interface itself always retains Phaos branding.
      </p>
    </PageShell>
  );
}

function ToggleRow({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
