import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Internal-only admin login. Not linked from the public site.
// Admins must be seeded manually in user_roles. No signup flow exposed.

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already signed in AND an admin, send to /admin/purge
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active || !session) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      if (active && roles?.some((r) => r.role === "admin")) {
        navigate("/admin/purge", { replace: true });
      }
    })();
    return () => { active = false; };
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        toast.error("Sign in failed.");
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session not established.");
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      if (!roles?.some((r) => r.role === "admin")) {
        await supabase.auth.signOut();
        toast.error("This account is not authorized for admin access.");
        return;
      }
      navigate("/admin/purge", { replace: true });
    } catch {
      toast.error("Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Internal — Admin Sign In</title>
        <meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />
      </Helmet>
      <main className="min-h-screen bg-background py-12 px-4 flex items-start justify-center">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-5 w-5" />
            <h1 className="text-2xl font-semibold text-foreground">Admin Sign In</h1>
          </div>

          <Alert className="mb-6 border-destructive/40 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-sm">
              <strong>Internal only.</strong> Admin accounts are seeded manually.
              Self-signup is disabled.
            </AlertDescription>
          </Alert>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" disabled={loading || !email || !password} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
};

export default AdminLogin;
