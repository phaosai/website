import { useEffect } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const VOICE_SANDBOX_URL = "https://voice.phaosai.com/try";

const VoiceTestLive = () => {
  useEffect(() => {
    window.location.replace(VOICE_SANDBOX_URL);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Test the Phaos AI Voice Agent Live | Phaos AI"
        description="Talk to the Phaos AI voice agent live in your browser. Try realistic conversations for service calls, quotes, supply orders, and lease questions."
        canonical="/voice-ai/test-live"
      />
      <Navigation />
      <section className="min-h-[70vh] px-6 pt-32 pb-20 flex items-center justify-center">
        <div className="max-w-xl text-center">
          <Loader2 className="mx-auto mb-5 h-8 w-8 animate-spin text-primary" aria-hidden />
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
            Opening Test It <span className="text-gradient-purple">Live</span>
          </h1>
          <p className="text-muted-foreground mb-7">
            Redirecting to the live Phaos AI voice sandbox.
          </p>
          <a
            href={VOICE_SANDBOX_URL}
            className="inline-flex items-center gap-2 bg-gradient-purple text-primary-foreground font-semibold px-7 py-3 rounded-full glow-purple hover:opacity-90 active:scale-[0.97] transition-all"
          >
            Open Voice Sandbox <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VoiceTestLive;
