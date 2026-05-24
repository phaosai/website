import { Suspense, lazy } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { SystemErrorBoundary } from "@/components/command-center/SystemErrorBoundary";

const VapiSandbox = lazy(() =>
  import("@/components/command-center/VapiSandbox").then((m) => ({ default: m.VapiSandbox })),
);

const Fallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const VoiceTestLive = () => (
  <div className="min-h-screen bg-background text-foreground">
    <SEOHead
      title="Test the Phaos AI Voice Agent Live | Phaos AI"
      description="Talk to the Phaos AI voice agent live in your browser — zero-latency, browser-based test."
      canonical="/voice-ai/test-live"
    />
    <Navigation />
    <main className="px-4 md:px-6 lg:px-8 pt-24 pb-16">
      <div className="max-w-7xl mx-auto">
        <SystemErrorBoundary>
          <Suspense fallback={<Fallback />}>
            <VapiSandbox />
          </Suspense>
        </SystemErrorBoundary>
      </div>
    </main>
    <Footer />
  </div>
);

export default VoiceTestLive;
