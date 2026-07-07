import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

/** Canonical Retell-powered voice sandbox lives on voice.phaosai.com */
const VOICE_SANDBOX_URL = "https://voice.phaosai.com/try";

const VoiceTestLive = () => {
  useEffect(() => {
    window.location.replace(VOICE_SANDBOX_URL);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Test the Phaos AI Voice Agent Live | Phaos AI"
        description="Talk to the Phaos AI voice agent live in your browser — powered by Retell AI on voice.phaosai.com."
        canonical="/voice-ai/test-live"
      />
      <Navigation />
      <main className="px-4 md:px-6 lg:px-8 pt-24 pb-16">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">
            Redirecting to the live voice sandbox…
          </p>
          <a
            href={VOICE_SANDBOX_URL}
            className="text-primary underline-offset-4 hover:underline"
          >
            Continue to voice.phaosai.com
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VoiceTestLive;
