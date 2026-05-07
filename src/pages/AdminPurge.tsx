import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ShieldCheck, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// SECURITY CRITICAL — Internal-only page.
// Tier 4a: requires Supabase Auth + admin role AND PURGE_ADMIN_TOKEN (defense in depth).
// PURGE_ADMIN_TOKEN is held only in React state (never localStorage / never persisted).

type PurgeResponse = {
  ok?: boolean;
  email_hash?: string;
  dry_run?: boolean;
  include_suppressions?: boolean;
  counts?: Record<string, number>;
  actions?: Record<string, string>;
  error?: string;
};

type AuditEntry = {
  id: string;
  created_at: string;
  email_hash: string;
  ip_hash: string | null;
  dry_run: boolean;
  include_suppressions: boolean;
  counts: Record<string, number>;
  actions: Record<string, string>;
  status: string;
  actor_user_id: string | null;
};

type SecurityEvent = {
  id: string;
  created_at: string;
  event_type: string;
  severity: string;
  source: string | null;
  ip_hash: string | null;
};

type SystemState = {
  chat_enabled: boolean;
  lead_capture_enabled: boolean;
  research_enabled: boolean;
};

const FUNCTIONS_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/purge-contact`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AdminPurge = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [includeSuppressions, setIncludeSuppressions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<PurgeResponse | null>(null);
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
  const [recent, setRecent] = useState<AuditEntry[] | null>(null);
  const [recentLoading, setRecentLoading] = useState(false);

  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [stateBusy, setStateBusy] = useState(false);
  const [events, setEvents] = useState<SecurityEvent[] | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Tier 4a: enforce auth + admin role on mount, redirect otherwise
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) {
        navigate("/admin/login", { replace: true });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      if (!active) return;
      if (!roles?.some((r) => r.role === "admin")) {
        await supabase.auth.signOut();
        navigate("/admin/login", { replace: true });
        return;
      }
      setUserEmail(session.user.email ?? null);
      setAuthChecked(true);
      // Load system_state & events in background (admin-only RLS)
      void loadSystemState();
      void loadEvents();
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wipe sensitive state when the tab is hidden or the user navigates away
  useEffect(() => {
    const wipe = () => {
      setToken("");
      setDryRunResult(null);
      setConfirmedEmail(null);
      setRecent(null);
    };
    window.addEventListener("beforeunload", wipe);
    return () => window.removeEventListener("beforeunload", wipe);
  }, []);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const canDryRun = token.length > 0 && EMAIL_RE.test(normalizedEmail) && !loading;
  const canConfirm = canDryRun && dryRunResult?.ok === true && confirmedEmail === normalizedEmail;

  async function callPurge(dryRun: boolean): Promise<PurgeResponse | null> {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please sign in again.");
        navigate("/admin/login", { replace: true });
        return null;
      }
      const res = await fetch(FUNCTIONS_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "X-Admin-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          dry_run: dryRun,
          include_suppressions: includeSuppressions,
        }),
      });
      const data: PurgeResponse = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || `Request failed (${res.status})`);
        return null;
      }
      return data;
    } catch {
      toast.error("Network error. Try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function onDryRun() {
    setDryRunResult(null);
    const data = await callPurge(true);
    if (data?.ok) {
      setDryRunResult(data);
      setConfirmedEmail(normalizedEmail);
      toast.success("Dry-run complete. Review counts before confirming.");
    }
  }

  async function onConfirm() {
    if (!canConfirm) return;
    const ok = window.confirm(
      `IRREVERSIBLE: purge data for ${normalizedEmail}?\n\n` +
        (includeSuppressions
          ? "This will ALSO delete the suppression record (CAN-SPAM opt-out proof). Use only for verified DSAR requests where the subject expressly asks to be removed from suppression lists."
          : "Suppression record will be retained as legal opt-out proof.")
    );
    if (!ok) return;
    const data = await callPurge(false);
    if (data?.ok) {
      toast.success("Purge complete.");
      setDryRunResult(data);
      setConfirmedEmail(null);
      loadRecent();
    }
  }

  async function loadRecent() {
    if (!token) {
      toast.error("Enter admin token first.");
      return;
    }
    setRecentLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login", { replace: true });
        return;
      }
      const res = await fetch(FUNCTIONS_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "X-Admin-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "recent" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || `Request failed (${res.status})`);
        return;
      }
      setRecent(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      toast.error("Network error loading audit log.");
    } finally {
      setRecentLoading(false);
    }
  }

  async function loadSystemState() {
    const { data, error } = await supabase
      .from("system_state")
      .select("chat_enabled, lead_capture_enabled, research_enabled")
      .eq("id", 1)
      .maybeSingle();
    if (!error && data) setSystemState(data as SystemState);
  }

  // Kill-switch second-factor: require the admin to type their own logged-in email.
  // This is not a secret — it's a friction gate to prevent accidental clicks.
  // True security rests on Supabase Auth + admin role + RLS on system_state.
  async function toggleSystemState(field: keyof SystemState, value: boolean) {
    if (stateBusy) return;
    const { data: { session } } = await supabase.auth.getSession();
    const expectedEmail = (session?.user.email ?? "").trim().toLowerCase();
    if (!expectedEmail) {
      toast.error("Session expired. Please sign in again.");
      return;
    }
    const entered = window.prompt(
      `Confirm kill-switch change:\n\n  ${field} → ${value ? "ENABLE" : "DISABLE"}\n\nType your admin email to proceed:`
    );
    if (entered === null) return;
    if (entered.trim().toLowerCase() !== expectedEmail) {
      toast.error("Email did not match. Kill switch unchanged.");
      setSystemState((s) => (s ? { ...s } : s));
      return;
    }
    setStateBusy(true);
    const { error } = await supabase
      .from("system_state")
      .update({ [field]: value, updated_by: session?.user.id, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) {
      toast.error("Failed to update kill switch.");
    } else {
      setSystemState((s) => (s ? { ...s, [field]: value } : s));
      toast.success(`${field} → ${value ? "enabled" : "DISABLED"}`);
    }
    setStateBusy(false);
  }

  async function loadEvents() {
    setEventsLoading(true);
    const { data, error } = await supabase
      .from("security_events")
      .select("id, created_at, event_type, severity, source, ip_hash")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error) setEvents((data as SecurityEvent[]) ?? []);
    setEventsLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  }

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const totalAffected = dryRunResult?.counts
    ? Object.values(dryRunResult.counts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <>
      <Helmet>
        <title>Internal — Contact Purge</title>
        <meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />
      </Helmet>

      <main className="min-h-screen bg-background py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-5 w-5" />
              <h1 className="text-2xl font-semibold text-foreground">
                Right-to-be-Forgotten — Contact Purge
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {userEmail && <span className="text-xs text-muted-foreground">{userEmail}</span>}
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-2 h-3 w-3" /> Sign out
              </Button>
            </div>
          </div>

          <Alert className="mb-6 border-destructive/40 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-sm">
              <strong>Internal use only.</strong> Two-factor: signed-in admin role +
              admin token (in memory only). Dry-run first. Hard-deletes are irreversible.
            </AlertDescription>
          </Alert>

          {/* Kill switch panel */}
          <Card className="p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4">System kill switch</h2>
            {systemState ? (
              <div className="space-y-3">
                {(["chat_enabled", "lead_capture_enabled", "research_enabled"] as const).map((k) => (
                  <div key={k} className="flex items-center justify-between">
                    <Label htmlFor={k} className="text-sm font-normal cursor-pointer">{k}</Label>
                    <Switch
                      id={k}
                      checked={systemState[k]}
                      disabled={stateBusy}
                      onCheckedChange={(v) => toggleSystemState(k, v)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </Card>

          <Card className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="token">Admin token (PURGE_ADMIN_TOKEN)</Label>
              <Input
                id="token"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setDryRunResult(null);
                  setConfirmedEmail(null);
                }}
                placeholder="PURGE_ADMIN_TOKEN"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Subject email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="off"
                spellCheck={false}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setDryRunResult(null);
                  setConfirmedEmail(null);
                }}
                placeholder="subject@example.com"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="suppress"
                checked={includeSuppressions}
                onCheckedChange={(c) => {
                  setIncludeSuppressions(Boolean(c));
                  setDryRunResult(null);
                  setConfirmedEmail(null);
                }}
              />
              <Label htmlFor="suppress" className="text-sm font-normal cursor-pointer">
                Also delete suppression record (destroys CAN-SPAM opt-out proof — rare)
              </Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={onDryRun} disabled={!canDryRun} variant="outline" className="flex-1">
                {loading && !dryRunResult && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Dry-run
              </Button>
              <Button onClick={onConfirm} disabled={!canConfirm} variant="destructive" className="flex-1">
                {loading && dryRunResult && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm purge
              </Button>
            </div>
          </Card>

          {dryRunResult?.ok && (
            <Card className="mt-6 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">
                  {dryRunResult.dry_run ? "Dry-run results" : "Purge complete"}
                </h2>
                <span className="text-xs text-muted-foreground font-mono">
                  hash: {dryRunResult.email_hash}
                </span>
              </div>
              {totalAffected === 0 ? (
                <p className="text-sm text-muted-foreground">No data found for this email across any table.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr><th className="pb-2 font-normal">Table</th><th className="pb-2 font-normal">Rows</th><th className="pb-2 font-normal">Action</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(dryRunResult.counts || {}).map(([table, count]) => (
                      <tr key={table} className="border-t border-border">
                        <td className="py-2 font-mono text-xs">{table}</td>
                        <td className="py-2">{count}</td>
                        <td className="py-2 text-xs text-muted-foreground">{dryRunResult.actions?.[table] || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {dryRunResult.dry_run && totalAffected > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Click <strong>Confirm purge</strong> to execute. This is irreversible.
                </p>
              )}
            </Card>
          )}

          <Card className="mt-6 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Recent purge activity</h2>
              <Button onClick={loadRecent} disabled={recentLoading || !token} variant="outline" size="sm">
                {recentLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {recent === null ? "Load last 20" : "Refresh"}
              </Button>
            </div>
            {recent === null ? (
              <p className="text-sm text-muted-foreground">
                Enter token and click <strong>Load last 20</strong>. Only hashed identifiers are shown.
              </p>
            ) : recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit entries yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="pb-2 font-normal">When</th>
                      <th className="pb-2 font-normal">Email hash</th>
                      <th className="pb-2 font-normal">Mode</th>
                      <th className="pb-2 font-normal">Total rows</th>
                      <th className="pb-2 font-normal">Suppr.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((e) => {
                      const total = Object.values(e.counts || {}).reduce(
                        (a, b) => a + (typeof b === "number" ? b : 0), 0
                      );
                      return (
                        <tr key={e.id} className="border-t border-border">
                          <td className="py-2 whitespace-nowrap text-muted-foreground">{new Date(e.created_at).toLocaleString()}</td>
                          <td className="py-2 font-mono">{e.email_hash}</td>
                          <td className="py-2">
                            <span className={e.dry_run ? "text-muted-foreground" : "text-destructive font-medium"}>
                              {e.dry_run ? "dry-run" : "PURGE"}
                            </span>
                          </td>
                          <td className="py-2">{total}</td>
                          <td className="py-2 text-muted-foreground">{e.include_suppressions ? "yes" : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="mt-6 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Recent security events</h2>
              <Button onClick={loadEvents} disabled={eventsLoading} variant="outline" size="sm">
                {eventsLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Refresh
              </Button>
            </div>
            {events === null ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events in the last window.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="pb-2 font-normal">When</th>
                      <th className="pb-2 font-normal">Type</th>
                      <th className="pb-2 font-normal">Severity</th>
                      <th className="pb-2 font-normal">Source</th>
                      <th className="pb-2 font-normal">IP hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id} className="border-t border-border">
                        <td className="py-2 whitespace-nowrap text-muted-foreground">{new Date(e.created_at).toLocaleString()}</td>
                        <td className="py-2 font-mono">{e.event_type}</td>
                        <td className="py-2">
                          <span className={
                            e.severity === "critical" ? "text-destructive font-bold" :
                            e.severity === "error" ? "text-destructive" :
                            e.severity === "warn" ? "text-yellow-500" : "text-muted-foreground"
                          }>{e.severity}</span>
                        </td>
                        <td className="py-2 text-muted-foreground">{e.source ?? "—"}</td>
                        <td className="py-2 font-mono text-muted-foreground">{e.ip_hash ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
};

export default AdminPurge;
