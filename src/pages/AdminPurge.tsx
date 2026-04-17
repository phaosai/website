import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

// SECURITY CRITICAL — Internal-only page. Not linked from anywhere.
// Token is held only in React state (never localStorage / never persisted).
// Real auth boundary lives in the purge-contact edge function (constant-time compare).

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
};

const FUNCTIONS_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/purge-contact`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AdminPurge = () => {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [includeSuppressions, setIncludeSuppressions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<PurgeResponse | null>(null);
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
  const [recent, setRecent] = useState<AuditEntry[] | null>(null);
  const [recentLoading, setRecentLoading] = useState(false);

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
  const canConfirm =
    canDryRun &&
    dryRunResult?.ok === true &&
    confirmedEmail === normalizedEmail;

  async function callPurge(dryRun: boolean): Promise<PurgeResponse | null> {
    setLoading(true);
    try {
      const res = await fetch(FUNCTIONS_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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
      setConfirmedEmail(null); // require fresh dry-run before another purge
    }
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
          <div className="mb-6 flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-5 w-5" />
            <h1 className="text-2xl font-semibold text-foreground">
              Right-to-be-Forgotten — Contact Purge
            </h1>
          </div>

          <Alert className="mb-6 border-destructive/40 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-sm">
              <strong>Internal use only.</strong> Token is held in memory only and is
              never stored. Always run a dry-run first. Hard-deletes are irreversible.
              Audited server-side via hashed email + hashed IP.
            </AlertDescription>
          </Alert>

          <Card className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="token">Admin token</Label>
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
              <Button
                onClick={onDryRun}
                disabled={!canDryRun}
                variant="outline"
                className="flex-1"
              >
                {loading && !dryRunResult && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Dry-run
              </Button>
              <Button
                onClick={onConfirm}
                disabled={!canConfirm}
                variant="destructive"
                className="flex-1"
              >
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
                <p className="text-sm text-muted-foreground">
                  No data found for this email across any table.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="pb-2 font-normal">Table</th>
                      <th className="pb-2 font-normal">Rows</th>
                      <th className="pb-2 font-normal">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(dryRunResult.counts || {}).map(([table, count]) => (
                      <tr key={table} className="border-t border-border">
                        <td className="py-2 font-mono text-xs">{table}</td>
                        <td className="py-2">{count}</td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {dryRunResult.actions?.[table] || "—"}
                        </td>
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
        </div>
      </main>
    </>
  );
};

export default AdminPurge;
