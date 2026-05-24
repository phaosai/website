import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle2, Database, HardDrive, Loader2, Mic, Phone, PhoneOff, Radio, Sparkles } from "lucide-react";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const VAPI_PUBLIC_KEY = "b4b4be59-182a-492b-bb0b-55aad26306ad";
const VAPI_ASSISTANT_ID = "9b500996-850d-416f-96b1-c7aa1eeb2dc3";

type TranscriptEntry = { role: "system" | "ai" | "caller"; text: string; timestamp: string; toolCall?: { name: string; args: Record<string, unknown> } };
type ReasoningEntry = { text: string; timestamp: string; type: "intent" | "action" | "routing" };
type VapiMessage = { type: string; transcriptType?: string; role?: string; transcript?: string; toolCalls?: Array<{ function?: { name?: string; arguments?: Record<string, unknown> } }>; functionCall?: { name?: string; arguments?: Record<string, unknown> }; latency?: number };
type VapiError = { message?: string } | string;

let warmVapi: Vapi | null = null;
let warmVapiPromise: Promise<Vapi> | null = null;

const prewarmVapi = () => {
  if (warmVapi) return Promise.resolve(warmVapi);
  if (warmVapiPromise) return warmVapiPromise;
  warmVapiPromise = import("@vapi-ai/web").then(({ default: VapiSdk }) => {
    warmVapi = new VapiSdk(VAPI_PUBLIC_KEY);
    return warmVapi;
  });
  return warmVapiPromise;
};

const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

const scrubPII = (text: string) =>
  text
    .replace(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "••••••••")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "••••@••••");

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
