import { lazy, Suspense, useEffect, useState } from "react";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useErrorReporter } from "@/hooks/useErrorReporter";
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
const OnePillarPage = lazy(() => import("./pages/OnePillarPage.tsx"));
const PhaosOne = lazy(() => import("./pages/PhaosOne.tsx"));
const PhaosSunesis = lazy(() => import("./pages/PhaosSunesis.tsx"));
const PhaosKyrios = lazy(() => import("./pages/PhaosKyrios.tsx"));
const PhaosAion = lazy(() => import("./pages/PhaosAion.tsx"));
const RunSimulation = lazy(() => import("./pages/RunSimulation.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const AppDashboard = lazy(() => import("./pages/AppDashboard.tsx"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn.tsx"));
const Billing = lazy(() => import("./pages/Billing.tsx"));
const AppLayout = lazy(() => import("./components/app/AppLayout.tsx"));
const CommandCenter = lazy(() => import("./pages/app/CommandCenter.tsx"));
const AppSection = lazy(() => import("./pages/app/AppSectionPlaceholder.tsx"));
const AppSettings = lazy(() => import("./pages/app/Settings.tsx"));

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
            <Route path="/admin/purge" element={<AdminPurge />} />
            <Route path="/one" element={<PhaosOne />} />
            <Route path="/one/aion" element={<PhaosAion />} />
            <Route path="/one/sunesis" element={<PhaosSunesis />} />
            <Route path="/one/kyrios" element={<PhaosKyrios />} />
            <Route path="/one/run-simulation" element={<RunSimulation />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/checkout/return" element={<CheckoutReturn />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<CommandCenter />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<AppSettings />} />
              <Route path="sunesis" element={<AppSection title="Sunesis" description="Source-grounded research." minTier="sunesis" emptyState="Generate your first Truth Memo on any ticker →" primaryCta={{ label: "Run a simulation", to: "/one/run-simulation" }} />} />
              <Route path="themes" element={<AppSection title="Investment Themes" description="Cross-signal narratives." minTier="sunesis" emptyState="No active themes yet." />} />
              <Route path="watchlists" element={<AppSection title="Watchlists" description="Track tickers and PCI signals." minTier="free" emptyState="Add your first ticker to start tracking PCI signals →" />} />
              <Route path="simulations" element={<AppSection title="Simulations" description="Stress-test scenarios." minTier="aion" emptyState="Run a free simulation to see scenario analysis →" primaryCta={{ label: "Run a simulation", to: "/one/run-simulation" }} />} />
              <Route path="kyrios" element={<AppSection title="Kyrios" description="Workflows and approvals." minTier="kyrios" emptyState="Your research review queue is clear." />} />
              <Route path="portals" element={<AppSection title="Client Portals" description="Branded research portals." minTier="kyrios" emptyState="No portals created yet." />} />
              <Route path="aion" element={<AppSection title="Aion" description="Monitoring and change detection." minTier="aion" emptyState="No material signal changes detected." />} />
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
