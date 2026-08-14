import { Outlet, useLocation } from "react-router-dom";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useIsLiveAccount } from "@/hooks/useIsLiveAccount";
import { Button } from "@/components/ui/button";
import { ComplianceFooter } from "@/components/ComplianceFooter";
import { SubscriptionsModal } from "@/components/pricing/SubscriptionsModal";
import { SubscriptionsModalContext } from "@/components/pricing/SubscriptionsModalContext";

const SunesisShell = lazy(() => import("@/pages/app/sunesis/SunesisShell"));
const SUBS_SEEN_KEY = "phaos_subscriptions_modal_seen";

// Routes that should be replaced with the explainer shell for free-tier users.
const SHELL_PREFIXES = [
  "/app/sunesis",
  "/app/themes",
  "/app/watchlists",
  "/app/leaderboard",
  "/app/simulations",
  "/app/security",
  "/app/audit",
  "/app/pantheon",
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const { isLive, loading } = useIsLiveAccount();
  const { pathname } = useLocation();
  const [subsOpen, setSubsOpen] = useState(false);

  const inShellArea = SHELL_PREFIXES.some((p) => pathname.startsWith(p));
  // Only admin ("live") accounts see real modules. All others — free or paid —
  // see the live-looking explainer shell.
  const showShell = inShellArea && !loading && !isLive;

  // Show the plans once per signed-in session, right after login/signup.
  useEffect(() => {
    if (!user) return;
    try {
      if (sessionStorage.getItem(SUBS_SEEN_KEY) === user.id) return;
      sessionStorage.setItem(SUBS_SEEN_KEY, user.id);
    } catch {
      /* storage unavailable — show once per mount */
    }
    setSubsOpen(true);
  }, [user]);

  const openSubs = useCallback(() => setSubsOpen(true), []);
  const subsCtx = useMemo(() => ({ open: openSubs }), [openSubs]);

  return (
    <ProtectedRoute>
      <SubscriptionsModalContext.Provider value={subsCtx}>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background text-foreground">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-12 flex items-center justify-between border-b border-border px-3">
                <SidebarTrigger />
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="hidden sm:inline">{user?.email}</span>
                  <Button size="sm" variant="ghost" onClick={signOut}>Sign out</Button>
                </div>
              </header>
              <main className="flex-1 overflow-auto">
                {showShell ? (
                  <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
                    <SunesisShell />
                  </Suspense>
                ) : (
                  <Outlet />
                )}
              </main>
              <ComplianceFooter />
            </div>
          </div>
          <SubscriptionsModal open={subsOpen} onClose={() => setSubsOpen(false)} />
        </SidebarProvider>
      </SubscriptionsModalContext.Provider>
    </ProtectedRoute>
  );
}
