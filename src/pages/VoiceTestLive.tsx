import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Phone, PhoneOff, Lightbulb, Loader2 } from "lucide-react";
import Vapi from "@vapi-ai/web";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

// Mirrors voice.phaosai.com defaults (VAPI public key is safe in the browser)
const VAPI_PUBLIC_KEY = "b4b4be59-182a-492b-bb0b-55aad26306ad";
const VAPI_ASSISTANT_ID = "9b500996-850d-416f-96b1-c7aa1eeb2dc3";

const RECOMMENDED_QUESTIONS = [
  "Can you order me a color toner?",
  "I'd like to place a service call.",
  "Can you tell me how many months I have left on my copier lease?",
  "Can I get a quote for a new MFP?",
];


const VoiceTestLive = () => {
  const { toast } = useToast();
  const vapiRef = useRef<Vapi | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      vapiRef.current?.stop();
      vapiRef.current = null;
    };
  }, []);

  const startCall = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Pre-flight mic permission inside the user gesture (iOS Safari / Android Chrome reliability)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        throw new Error("Microphone permission denied. Enable it in your browser settings and try again.");
      }

      const vapi = new Vapi(VAPI_PUBLIC_KEY);
      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        setIsConnected(true);
        setIsConnecting(false);
        toast({ title: "Connected", description: "You're live with the Phaos AI voice agent." });
      });
      vapi.on("call-end", () => {
        setIsConnected(false);
        setIsSpeaking(false);
        toast({ title: "Call ended", description: "The voice agent session has ended." });
      });
      vapi.on("speech-start", () => setIsSpeaking(true));
      vapi.on("speech-end", () => setIsSpeaking(false));
      vapi.on("error", (e: unknown) => {
        console.error("[VoiceTestLive] vapi error:", e);
        const msg = e instanceof Error ? e.message : "Connection error.";
        toast({ variant: "destructive", title: "Voice agent error", description: msg });
        setIsConnecting(false);
      });

      await vapi.start(VAPI_ASSISTANT_ID);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start the voice agent.";
      console.error("[VoiceTestLive] start error:", err);
      toast({ variant: "destructive", title: "Couldn't start the call", description: message });
      setIsConnecting(false);
    }
  }, [toast]);


  const endCall = useCallback(() => {
    vapiRef.current?.stop();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Test the Phaos AI Voice Agent Live | Phaos AI"
        description="Talk to the Phaos AI voice agent live in your browser. Try realistic conversations for service calls, quotes, supply orders, and lease questions."
        canonical="/voice-ai/test-live"
      />
      <Navigation />

      <section className="relative pt-32 pb-16 px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-primary/10 blur-[180px] pointer-events-none" aria-hidden />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
              <Mic className="w-4 h-4 text-primary" aria-hidden />
              <span className="text-sm text-primary font-medium">Live Voice Sandbox</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
              Test It <span className="text-gradient-purple">Live</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Talk to the Phaos AI voice agent right in your browser. No download, no signup — just a real conversation.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 sm:p-10 shadow-xl shadow-primary/5">
            <div className="flex flex-col items-center text-center gap-6">
              <div
                className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all ${
                  isConnected ? "bg-gradient-purple glow-purple-lg" : "bg-primary/10 border border-primary/30"
                }`}
              >
                {isSpeaking && (
                  <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" aria-hidden />
                )}
                {isConnected ? (
                  <Mic className="w-12 h-12 text-primary-foreground" aria-hidden />
                ) : (
                  <MicOff className="w-12 h-12 text-primary" aria-hidden />
                )}
              </div>

              <div>
                <p className="text-sm uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                <p className="text-xl font-semibold">
                  {isConnected
                    ? isSpeaking
                      ? "Agent is speaking…"
                      : "Listening — go ahead"
                    : "Ready to connect"}
                </p>
              </div>

              {isConnected ? (
                <button
                  type="button"
                  onClick={endCall}
                  className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground font-semibold px-7 py-3 rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
                >
                  <PhoneOff className="w-4 h-4" /> End Call
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCall}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-2 bg-gradient-purple text-primary-foreground font-semibold px-7 py-3 rounded-full glow-purple-lg hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                  ) : (
                    <><Phone className="w-4 h-4" /> Start Live Call</>
                  )}
                </button>
              )}
              <p className="text-xs text-muted-foreground max-w-md">
                Your browser will ask for microphone permission. Audio is streamed securely and never stored.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-border/60 bg-card/40 p-7 sm:p-9">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-5 h-5 text-primary" aria-hidden />
              <h2 className="text-xl font-bold">Recommended Questions</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Not sure what to say? Try one of these out loud once the call connects.
            </p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {RECOMMENDED_QUESTIONS.map((q) => (
                <li
                  key={q}
                  className="rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-foreground hover:border-primary/40 transition-colors"
                >
                  “{q}”
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VoiceTestLive;
