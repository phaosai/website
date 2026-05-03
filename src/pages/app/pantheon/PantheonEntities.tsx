import { useEffect, useState } from "react";
import { PageShell, EmptyCard } from "@/components/app/PageShell";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Building2, Trash2 } from "lucide-react";

interface Entity {
  id: string;
  name: string;
  entity_type: string | null;
  notes: string | null;
  created_at: string;
}

export default function PantheonEntities() {
  const { organizationId, role } = useOrganization();
  const isAdmin = role === "owner" || role === "admin";
  const [entities, setEntities] = useState<Entity[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("");

  const load = async () => {
    if (!organizationId) return;
    const { data } = await supabase.from("client_entities")
      .select("id,name,entity_type,notes,created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    setEntities(data ?? []);
  };

  useEffect(() => { load(); }, [organizationId]);

  const create = async () => {
    if (!name.trim() || !organizationId) return;
    const { error } = await supabase.from("client_entities").insert({
      organization_id: organizationId,
      name: name.trim(),
      entity_type: type.trim() || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Entity created"); setName(""); setType(""); await load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this entity?")) return;
    const { error } = await supabase.from("client_entities").delete().eq("id", id);
    if (error) toast.error(error.message);
    else await load();
  };

  return (
    <PageShell title="Multi-Entity Management"
      description="Isolated client entities with separate data and audit segments"
      minTier="pantheon">
      {isAdmin && (
        <section className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">New entity</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input placeholder='Entity name (e.g. "Smith Family Trust")' value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Type (optional, e.g. Trust, Fund)" value={type} onChange={(e) => setType(e.target.value)} className="sm:w-64" />
            <Button onClick={create}>Create</Button>
          </div>
        </section>
      )}

      {entities.length === 0 ? (
        <EmptyCard>No client entities yet.</EmptyCard>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {entities.map((e) => (
            <div key={e.id} className="rounded-xl border border-border p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 font-semibold">
                  <Building2 className="h-4 w-4 text-purple-deep" />
                  {e.name}
                </div>
                {e.entity_type && <p className="text-xs text-muted-foreground mt-1">{e.entity_type}</p>}
                <p className="text-xs text-muted-foreground mt-2">Created {new Date(e.created_at).toLocaleDateString()}</p>
              </div>
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => remove(e.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
