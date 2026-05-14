import { lazy, Suspense, useEffect, useState } from "react";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useErrorReporter } from "@/hooks/useErrorReporter";
import { useLoginTracker } from "@/hooks/useLoginTracker";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const ChatWidget = lazy(() => import("./components/ChatWidget"));
const WorkflowTeardownPopup = lazy(() => import("./components/WorkflowTeardownPopup"));
const PhaosNavigator = lazy(() => import("./components/PhaosNavigator"));
const CustomCursor = lazy(() => import("./components/CustomCursor"));

const Integrations = lazy(() => import("./pages/Integrations.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Careers = lazy(() => import("./pages/Careers.tsx"));
const Partners = lazy(() => import("./pages/Partners.tsx"));
const Investors = lazy(() => import("./pages/Investors.tsx"));
const VoiceAI = lazy(() => import("./pages/VoiceAI.tsx"));
const Workflows = lazy(() => import("./pages/Workflows.tsx"));
const Security = lazy(() => import("./pages/Security.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const ROICalculatorPage = lazy(() => import("./pages/ROICalculator.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const InvestorRelations = lazy(() => import("./pages/InvestorRelations.tsx"));
const ComparePage = lazy(() => import("./pages/ComparePage.tsx"));
const SolutionsPage = lazy(() => import("./pages/SolutionsPage.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const AdminPurge = lazy(() => import("./pages/AdminPurge.tsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const PhaosOne = lazy(() => import("./pages/PhaosOne.tsx"));
const PhaosSunesis = lazy(() => import("./pages/PhaosSunesis.tsx"));
const RunSimulation = lazy(() => import("./pages/RunSimulation.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const SignIn = lazy(() => import("./pages/SignIn.tsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const AppDashboard = lazy(() => import("./pages/AppDashboard.tsx"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn.tsx"));
const Billing = lazy(() => import("./pages/Billing.tsx"));
const AppLayout = lazy(() => import("./components/app/AppLayout.tsx"));
const CommandCenter = lazy(() => import("./pages/app/CommandCenter.tsx"));
const AppSection = lazy(() => import("./pages/app/AppSectionPlaceholder.tsx"));
const AppSettings = lazy(() => import("./pages/app/Settings.tsx"));
const SunesisResearch = lazy(() => import("./pages/app/sunesis/SunesisResearch.tsx"));
const SunesisTicker = lazy(() => import("./pages/app/sunesis/SunesisTicker.tsx"));
const SunesisThemes = lazy(() => import("./pages/app/sunesis/SunesisThemes.tsx"));
const SunesisThemeDetail = lazy(() => import("./pages/app/sunesis/SunesisThemeDetail.tsx"));
const SunesisSandbox = lazy(() => import("./pages/app/sunesis/SunesisSandbox.tsx"));
const SunesisLanguage = lazy(() => import("./pages/app/sunesis/SunesisLanguage.tsx"));
const SunesisWorkflow = lazy(() => import("./pages/app/sunesis/SunesisWorkflow.tsx"));
const SunesisCompliance = lazy(() => import("./pages/app/sunesis/SunesisCompliance.tsx"));
const SunesisLedger = lazy(() => import("./pages/app/sunesis/SunesisLedger.tsx"));
const SunesisWatchlists = lazy(() => import("./pages/app/sunesis/SunesisWatchlists.tsx"));
const SunesisLeaderboard = lazy(() => import("./pages/app/sunesis/SunesisLeaderboard.tsx"));
const AionSimulate = lazy(() => import("./pages/app/aion/AionSimulate.tsx"));
const AionSecurity = lazy(() => import("./pages/app/aion/AionSecurity.tsx"));
const AionAudit = lazy(() => import("./pages/app/aion/AionAudit.tsx"));
const PantheonDashboard = lazy(() => import("./pages/app/pantheon/PantheonDashboard.tsx"));
const PantheonTeam = lazy(() => import("./pages/app/pantheon/PantheonTeam.tsx"));
const PantheonLogos = lazy(() => import("./pages/app/pantheon/PantheonLogos.tsx"));
const PantheonAudit = lazy(() => import("./pages/app/pantheon/PantheonAudit.tsx"));
const PantheonEntities = lazy(() => import("./pages/app/pantheon/PantheonEntities.tsx"));
const FoundryAdmin = lazy(() => import("./pages/app/foundry/FoundryAdmin.tsx"));

const queryClient = new QueryClient();

const DeferredGlobalUI = () => {
  const [showGlobalUI, setShowGlobalUI] = useState(false);

  useEffect(() => {
    let timer: number | null = null;

    const schedule = () => {
      timer = window.setTimeout(() => setShowGlobalUI(true), 1500);
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }

    return () => {
      window.removeEventListener("load", schedule);
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  // Hide all global UI on internal /admin/* routes
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
    return null;
  }

  if (!showGlobalUI) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <ChatWidget />
      <WorkflowTeardownPopup />
      <PhaosNavigator />
      <CustomCursor />
    </Suspense>
  );
};

const BrowserRouterAuthWrapper = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  </BrowserRouter>
);

const AppInner = () => {
  useErrorReporter();
  useLoginTracker();
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/voice-ai" element={<VoiceAI />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/security" element={<Security />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/roi-calculator" element={<ROICalculatorPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/investor-relations" element={<InvestorRelations />} />
            <Route path="/compare/:competitor" element={<ComparePage />} />
            <Route path="/solutions/:industry" element={<SolutionsPage />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/purge" element={<AdminPurge />} />
            <Route path="/one" element={<PhaosOne />} />
             <Route path="/one/aion" element={<Navigate to="/one" replace />} />
             <Route path="/one/sunesis" element={<PhaosSunesis />} />
             <Route path="/one/kyrios" element={<Navigate to="/one" replace />} />
            <Route path="/one/run-simulation" element={<RunSimulation />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/checkout/return" element={<CheckoutReturn />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/login" element={<Navigate to="/signin" replace />} />
            <Route path="/sign-in" element={<Navigate to="/signin" replace />} />
            <Route path="/log-in" element={<Navigate to="/signin" replace />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<CommandCenter />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<AppSettings />} />
              <Route path="sunesis" element={<SunesisResearch />} />
              <Route path="sunesis/ticker/:symbol" element={<SunesisTicker />} />
              <Route path="sunesis/themes" element={<SunesisThemes />} />
              <Route path="sunesis/themes/:themeId" element={<SunesisThemeDetail />} />
              <Route path="sunesis/sandbox" element={<SunesisSandbox />} />
              <Route path="sunesis/language" element={<SunesisLanguage />} />
              <Route path="sunesis/workflow" element={<SunesisWorkflow />} />
              <Route path="sunesis/compliance" element={<SunesisCompliance />} />
              <Route path="sunesis/ledger" element={<SunesisLedger />} />
              <Route path="foundry" element={<FoundryAdmin />} />
              <Route path="themes" element={<SunesisThemes />} />
              <Route path="themes/:themeId" element={<SunesisThemeDetail />} />
              <Route path="watchlists" element={<SunesisWatchlists />} />
              <Route path="leaderboard" element={<SunesisLeaderboard />} />
               <Route path="simulations" element={<AionSimulate />} />
               <Route path="security" element={<AionSecurity />} />
               <Route path="audit" element={<AionAudit />} />
               <Route path="kyrios" element={<Navigate to="/app" replace />} />
               <Route path="kyrios/*" element={<Navigate to="/app" replace />} />
               <Route path="aion" element={<Navigate to="/app" replace />} />
               <Route path="aion/*" element={<Navigate to="/app" replace />} />
               <Route path="portals" element={<Navigate to="/app" replace />} />
              <Route path="pantheon" element={<PantheonDashboard />} />
              <Route path="pantheon/team" element={<PantheonTeam />} />
              <Route path="pantheon/logos" element={<PantheonLogos />} />
              <Route path="pantheon/audit" element={<PantheonAudit />} />
              <Route path="pantheon/entities" element={<PantheonEntities />} />
            </Route>
            <Route path="/app/legacy" element={<ProtectedRoute><AppDashboard /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </Suspense>
      <DeferredGlobalUI />
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouterAuthWrapper />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
