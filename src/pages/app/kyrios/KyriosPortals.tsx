import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageShell, EmptyCard } from "@/components/app/PageShell";

export default function KyriosPortals() {
  const [portals, setPortals] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("client_portals")
        .select("id,name,client_name,status,created_at")
        .order("created_at", { ascending: false });
      setPortals(data ?? []);
    })();
  }, []);

  return (
    <PageShell title="Client Portals" description="Branded research delivery." minTier="kyrios"
      actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Create new portal</Button>}>
      {portals.length === 0 ? (
        <EmptyCard>No portals created yet.</EmptyCard>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Portal</th>
                <th className="text-left p-3">Client</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {portals.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-muted-foreground">{p.client_name ?? "—"}</td>
                  <td className="p-3 capitalize">{p.status}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
