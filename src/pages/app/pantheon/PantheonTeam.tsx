import { useEffect, useState } from "react";
import { PageShell, EmptyCard } from "@/components/app/PageShell";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const SEAT_LIMIT = 5;
type Role = "owner" | "admin" | "analyst" | "client_viewer";

interface Seat {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string | null;
  full_name?: string | null;
}

export default function PantheonTeam() {
  const { organizationId, role: myRole } = useOrganization();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("analyst");
  const [loading, setLoading] = useState(false);

  const isAdmin = myRole === "owner" || myRole === "admin";

  const load = async () => {
    if (!organizationId) return;
    const { data } = await supabase
      .from("memberships")
      .select("id,user_id,role,created_at, users:user_id(email,full_name)")
      .eq("organization_id", organizationId);
    setSeats(((data as any[]) ?? []).map((m) => ({
      ...m,
      email: m.users?.email ?? null,
      full_name: m.users?.full_name ?? null,
    })));
  };

  useEffect(() => { load(); }, [organizationId]);

  const invite = async () => {
    if (!email || !organizationId) return;
    if (seats.length >= SEAT_LIMIT) {
      toast.error("Seat limit reached. Contact us for custom enterprise pricing.");
      return;
    }
    setLoading(true);
    // Look up existing user by email
    const { data: targetUser } = await supabase.from("users").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
    if (!targetUser) {
      toast.error("User must sign up first. Send them a sign-up link.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.from("memberships").insert({
      organization_id: organizationId,
      user_id: targetUser.id,
      role: newRole,
    });
    if (error) toast.error(error.message);
    else { toast.success("Seat added"); setEmail(""); await load(); }
    setLoading(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this seat? Their data is preserved, but access is revoked.")) return;
    const { error } = await supabase.from("memberships").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Seat removed"); await load(); }
  };

  return (
    <PageShell title="Seat Management" description={`${seats.length} of ${SEAT_LIMIT} seats active`} minTier="pantheon">
      {isAdmin && (
        <section className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">Invite a user</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input placeholder="email@firm.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
              <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="client_viewer">Client Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={invite} disabled={loading || seats.length >= SEAT_LIMIT}>Add seat</Button>
          </div>
          {seats.length >= SEAT_LIMIT && (
            <p className="mt-3 text-xs text-amber-400">
              Seat limit reached. <a href="/contact" className="underline">Contact us for custom enterprise pricing</a>.
            </p>
          )}
        </section>
      )}

      <section className="rounded-xl border border-border overflow-hidden">
        {seats.length === 0 ? (
          <EmptyCard>No seats provisioned yet.</EmptyCard>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">User</th>
                <th className="text-left px-4 py-2">Role</th>
                <th className="text-left px-4 py-2">Added</th>
                {isAdmin && <th className="px-4 py-2"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {seats.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2">
                    <div className="font-medium">{s.full_name ?? s.email ?? s.user_id.slice(0, 8)}</div>
                    {s.email && <div className="text-xs text-muted-foreground">{s.email}</div>}
                  </td>
                  <td className="px-4 py-2 capitalize">{s.role.replace("_", " ")}</td>
                  <td className="px-4 py-2 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                  {isAdmin && (
                    <td className="px-4 py-2 text-right">
                      {s.role !== "owner" && (
                        <Button variant="ghost" size="sm" onClick={() => remove(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </PageShell>
  );
}
