import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, FileText, Layers, ShieldCheck, Receipt } from "lucide-react";
import { PageShell, EmptyCard } from "@/components/app/PageShell";
import { useOrganization } from "@/hooks/useOrganization";
import { useEntitlements } from "@/hooks/useEntitlements";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const SEAT_LIMIT = 5;

interface Stats {
  seats: number;
  memosThisMonth: number;
  activePortals: number;
  recentAudits: { id: string; action: string; created_at: string; resource_type: string | null }[];
  status: string | null;
}

export default function PantheonDashboard() {
  const { organizationId, organizationName, loading: orgLoading } = useOrganization();
  const ent = useEntitlements();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    (async () => {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const [seats, memos, portals, audits] = await Promise.all([
        supabase.from("memberships").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
        supabase.from("truth_memos").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("created_at", monthStart.toISOString()),
        supabase.from("client_portals").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
        supabase.from("audit_events").select("id,action,created_at,resource_type").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(6),
      ]);
      setStats({
        seats: seats.count ?? 0,
        memosThisMonth: memos.count ?? 0,
        activePortals: portals.count ?? 0,
        recentAudits: audits.data ?? [],
        status: ent.status,
      });
    })();
  }, [organizationId, ent.status]);

  return (
    <PageShell title="Pantheon" description={organizationName ?? "Institutional command"} minTier="pantheon">
      {orgLoading ? null : !organizationId ? (
        <EmptyCard>No organization linked to your account yet.</EmptyCard>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card icon={<Users className="h-4 w-4" />} label="Seats" value={`${stats?.seats ?? 0} / ${SEAT_LIMIT}`} href="/app/pantheon/team" />
            <Card icon={<FileText className="h-4 w-4" />} label="Memos this month" value={`${stats?.memosThisMonth ?? 0}`} />
            <Card icon={<Layers className="h-4 w-4" />} label="Active client portals" value={`${stats?.activePortals ?? 0}`} href="/app/portals" />
            <Card icon={<Receipt className="h-4 w-4" />} label="Billing" value={ent.status ?? "—"} href="/app/billing" />
          </div>

          <section className="rounded-xl border border-border p-5">
            <header className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-purple-deep" /> Recent compliance log
              </div>
              <Link to="/app/pantheon/audit" className="text-xs text-purple-deep hover:underline">View all →</Link>
            </header>
            {stats && stats.recentAudits.length > 0 ? (
              <ul className="divide-y divide-border text-sm">
                {stats.recentAudits.map((a) => (
                  <li key={a.id} className="py-2 flex items-center justify-between">
                    <span>{a.action} <span className="text-muted-foreground">· {a.resource_type ?? "—"}</span></span>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            )}
          </section>

          <div className="flex gap-3 flex-wrap">
            <Link to="/app/pantheon/team"><Button variant="outline" size="sm">Manage seats</Button></Link>
            <Link to="/app/pantheon/logos"><Button variant="outline" size="sm">Logos branding</Button></Link>
            <Link to="/app/pantheon/entities"><Button variant="outline" size="sm">Multi-entity</Button></Link>
            <Link to="/app/pantheon/audit"><Button variant="outline" size="sm">Audit logs</Button></Link>
          </div>
        </>
      )}
    </PageShell>
  );
}

function Card({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <div className="rounded-xl border border-border p-4 hover:border-purple-deep/40 transition-colors">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}
