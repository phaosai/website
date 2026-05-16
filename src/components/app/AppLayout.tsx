import { Outlet, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Button } from "@/components/ui/button";

const SunesisShell = lazy(() => import("@/pages/app/sunesis/SunesisShell"));

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
  const ent = useEntitlements();
  const { pathname } = useLocation();

  const inShellArea = SHELL_PREFIXES.some((p) => pathname.startsWith(p));
  const isFree = !ent.loading && ent.tier === "free";
  const showShell = inShellArea && isFree;

  return (
    <ProtectedRoute>
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
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
