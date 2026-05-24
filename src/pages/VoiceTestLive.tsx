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
const HIGH_LATENCY_THRESHOLD_MS = 1500;

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
const scrubPII = (text: string) => text.replace(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "••••••••").replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "••••@••••");

const VoiceTestLive = () => {
  const vapiRef = useRef<Vapi | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reasoningScrollRef = useRef<HTMLDivElement>(null);
  const [callActive, setCallActive] = useState(false);
  const [callConnecting, setCallConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [reasoning, setReasoning] = useState<ReasoningEntry[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [structuredOutputs, setStructuredOutputs] = useState<string[]>([]);
  const [liveQueryActive, setLiveQueryActive] = useState(false);
  const highLatency = latencyMs !== null && latencyMs > HIGH_LATENCY_THRESHOLD_MS;

  const addReasoning = useCallback((text: string, type: ReasoningEntry["type"]) => {
    setReasoning((prev) => [...prev.slice(-199), { text, timestamp: new Date().toLocaleTimeString(), type }]);
  }, []);

  const addTranscript = useCallback((entry: TranscriptEntry) => {
    setTranscript((prev) => [...prev.slice(-199), entry]);
  }, []);

  useEffect(() => {
    prewarmVapi().catch(() => undefined);
    return () => {
      vapiRef.current?.stop();
      vapiRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!callActive) return;
    const timer = window.setInterval(() => setCallDuration((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [callActive]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcript]);

  useEffect(() => {
    if (reasoningScrollRef.current) reasoningScrollRef.current.scrollTop = reasoningScrollRef.current.scrollHeight;
  }, [reasoning]);

  const startCall = useCallback(async () => {
    setCallConnecting(true);
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((track) => track.stop());
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name ?? "";
      toast.error(name === "NotFoundError" ? "No microphone detected on this device." : "Microphone access blocked. Allow Microphone in the address bar, then try again.", { duration: 9000 });
      setCallConnecting(false);
      return;
    }

    let connectWatchdog: ReturnType<typeof setTimeout> | null = null;
    try {
      const vapi = warmVapi ?? (await prewarmVapi());
      vapiRef.current = vapi;
      setCallDuration(0);
      setTranscript([]);
      setReasoning([]);
      setStructuredOutputs([]);
      setLatencyMs(null);
      setLiveQueryActive(false);
      addReasoning("Phaos AI Core Engine — handshake in flight", "action");
      addTranscript({ role: "system", text: "Connecting to Phaos AI Core Engine...", timestamp: "00:00" });

      connectWatchdog = setTimeout(() => {
        vapi.stop();
        setCallConnecting(false);
        setCallActive(false);
        toast.error("Connection timed out. Check your network signal and try again.", { duration: 9000 });
      }, 20000);

      vapi.on("call-start", () => {
        if (connectWatchdog) clearTimeout(connectWatchdog);
        setCallActive(true);
        setCallConnecting(false);
        addReasoning("Secure connection established — Phaos voice engine active", "action");
        addTranscript({ role: "system", text: "Call connected — Phaos AI active", timestamp: "00:00" });
      });
      vapi.on("call-end", () => {
        if (connectWatchdog) clearTimeout(connectWatchdog);
        setCallActive(false);
        setCallConnecting(false);
        setIsSpeaking(false);
        setVolumeLevel(0);
        addReasoning("Call terminated.", "action");
        addTranscript({ role: "system", text: "Call ended.", timestamp: formatTime(callDuration) });
      });
      vapi.on("speech-start", () => {
        setIsSpeaking(true);
        addReasoning("Agent speaking — streaming voice output", "action");
      });
      vapi.on("speech-end", () => setIsSpeaking(false));
      vapi.on("volume-level", (level: number) => setVolumeLevel(level));
      vapi.on("message", (msg: VapiMessage) => {
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        if (msg.type === "transcript" && msg.transcriptType === "final") {
          const text = msg.transcript ?? "";
          if (msg.role === "assistant") addTranscript({ role: "ai", text, timestamp: now });
          if (msg.role === "user") {
            addTranscript({ role: "caller", text, timestamp: now });
            addReasoning(`Caller: "${text.slice(0, 80)}${text.length > 80 ? "..." : ""}"`, "intent");
          }
          if (/e-automate|sales chain|querying|pulling/i.test(text)) {
            setLiveQueryActive(true);
            window.setTimeout(() => setLiveQueryActive(false), 3000);
          }
        }
        if (msg.type === "function-call" || msg.type === "tool-calls") {
          const calls = msg.type === "tool-calls" ? msg.toolCalls ?? [] : [{ function: msg.functionCall }];
          calls.forEach((call) => {
            const name = call.function?.name ?? "unknown_tool";
            addTranscript({ role: "system", text: `⚡ EXECUTING: ${name}`, timestamp: now, toolCall: { name, args: call.function?.arguments ?? {} } });
            addReasoning(`⚡ Tool triggered: ${name}`, "action");
            if (/dispatch|service/i.test(name)) setStructuredOutputs((prev) => [...new Set([...prev, "APPOINTMENT_SET"])]);
            if (/resolve|toner|fix/i.test(name)) setStructuredOutputs((prev) => [...new Set([...prev, "ISSUE_RESOLVED"])]);
          });
        }
        if (msg.type === "latency" && typeof msg.latency === "number") setLatencyMs(msg.latency);
      });
      vapi.on("error", (err: VapiError) => {
        if (connectWatchdog) clearTimeout(connectWatchdog);
        const detail = typeof err === "string" ? err : err?.message ?? "Unknown";
        addReasoning(`Error: ${detail}`, "action");
        toast.error(`Call error: ${detail}`, { duration: 6000 });
        setCallActive(false);
        setCallConnecting(false);
      });

      await vapi.start(VAPI_ASSISTANT_ID);
    } catch (err: unknown) {
      if (connectWatchdog) clearTimeout(connectWatchdog);
      toast.error(`Failed to connect: ${err instanceof Error ? err.message : "Unknown error"}`);
      setCallConnecting(false);
    }
  }, [addReasoning, addTranscript, callDuration]);

  const endCall = useCallback(() => {
    vapiRef.current?.stop();
    setCallActive(false);
    setCallConnecting(false);
    setIsSpeaking(false);
    setVolumeLevel(0);
  }, []);

  const callStatus = callConnecting ? "Connecting..." : callActive ? (isSpeaking ? "Phoebe Speaking" : "Listening...") : "Ready";
  const orbScale = 1 + volumeLevel * 0.4;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead title="Test the Phaos AI Voice Agent Live | Phaos AI" description="Talk to the Phaos AI voice agent live in your browser." canonical="/voice-ai/test-live" />
      <Navigation />
      <main className="px-4 md:px-6 lg:px-8 pt-24 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {liveQueryActive && callActive && <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/30 font-mono text-xs"><Radio size={16} className="text-primary" /><span className="text-primary font-bold">LIVE QUERY</span><span className="text-muted-foreground">— Phoebe is querying external systems...</span></div>}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex flex-col gap-4 w-full lg:w-[360px] shrink-0">
              <div className="glass p-6 relative overflow-hidden rounded-lg" role="region" aria-label="Voice call controls">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.12),transparent_70%)]" />
                <div className="relative z-10 flex flex-col items-center">
                  <motion.div animate={{ scale: callActive ? orbScale : 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="w-32 h-32 rounded-full border-2 border-primary/40 flex items-center justify-center relative" style={{ boxShadow: callActive ? `0 0 ${20 + volumeLevel * 40}px hsl(var(--primary) / ${0.3 + volumeLevel * 0.4})` : "0 0 20px hsl(var(--primary) / 0.1)" }}>
                    {callConnecting ? <Loader2 size={36} className="text-primary animate-spin" /> : <Phone size={36} className={isSpeaking ? "text-accent" : "text-primary"} />}
                  </motion.div>
                  <h1 className="mt-4 text-base font-bold text-foreground tracking-tight text-center">Phoebe — SOA</h1>
                  <p className="text-muted-foreground text-xs text-center mt-1 max-w-[220px]">{callActive ? callStatus : "Phaos AI Core Engine — Zero-Latency Voice"}</p>
                  {callActive && <div className="mt-2 font-mono text-sm text-primary tabular-nums">{formatTime(callDuration)}</div>}
                  {!callActive ? <button onClick={startCall} disabled={callConnecting} className="mt-4 w-full py-3 bg-gradient-purple text-primary-foreground font-black uppercase tracking-widest rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all glow-purple flex items-center justify-center gap-3 text-sm disabled:opacity-50"><Phone size={18} />{callConnecting ? "Connecting..." : "Start AI Call"}</button> : <button onClick={endCall} className="mt-4 w-full py-3 bg-destructive text-destructive-foreground font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-3 text-sm"><PhoneOff size={18} /> End Call</button>}
                  <div className="mt-4 w-full space-y-1.5 font-mono text-[10px]"><div className="flex justify-between text-muted-foreground"><span>LATENCY</span><span>{latencyMs !== null ? `${latencyMs}ms` : "—"}</span></div><div className="flex justify-between text-muted-foreground"><span>ENGINE</span><span className="text-foreground">Phaos AI Core Engine v2</span></div><div className="flex justify-between text-muted-foreground"><span>TRANSPORT</span><span className="text-primary">Phaos Secure Stream</span></div></div>
                  <p className="text-[9px] text-muted-foreground mt-3 font-mono">POWERED BY PHAOS AI — SOA TECHNOLOGY</p>
                </div>
              </div>
              <div className="glass p-4 rounded-lg space-y-2"><div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px] border-b border-border/30 pb-2"><Sparkles size={12} className="text-primary" /> RECOMMENDED QUESTIONS</div>{["Can you order me a color toner?", "I'd like to place a service call.", "Can you tell me how many months I have left on my copier lease?", "Can I get a quote for a new MFP?"].map((q) => <button key={q} onClick={() => { navigator.clipboard?.writeText(q).catch(() => undefined); toast.success("Copied — read it aloud once the call connects."); }} className="w-full text-left text-[11px] leading-snug px-3 py-2 rounded-lg bg-secondary/40 hover:bg-primary/10 border border-border/30 text-foreground/90 transition-colors">&ldquo;{q}&rdquo;</button>)}</div>
              <div className="glass p-4 font-mono text-[11px] overflow-hidden flex flex-col h-[280px] rounded-lg"><div className="flex items-center gap-2 text-muted-foreground mb-2 border-b border-border/30 pb-2"><Brain size={12} className="text-primary" /> PHAOS REASONING</div><div ref={reasoningScrollRef} className="flex-1 overflow-y-auto space-y-2">{reasoning.length === 0 ? <p className="text-muted-foreground italic text-[10px] mt-4">Reasoning log activates during a live call...</p> : reasoning.map((entry, i) => <div key={i} className="flex gap-2 items-start"><span className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 bg-primary" /><div><span className="text-[9px] text-muted-foreground">{entry.timestamp}</span><p className="text-foreground/80 text-[10px]">{entry.text}</p></div></div>)}</div></div>
            </div>
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              <div className="glass p-4 font-mono text-[11px] overflow-hidden flex flex-col h-[300px] rounded-lg"><div className="flex items-center gap-2 text-muted-foreground mb-2 border-b border-border/30 pb-2"><Database size={12} /> SOA REASONING TERMINAL {callActive && <span className="ml-auto flex items-center gap-1.5 text-primary"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> LIVE</span>}</div><div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 text-primary/80">{transcript.length === 0 ? <p className="text-muted-foreground italic mt-4">Press "Start AI Call" — one click to begin...</p> : transcript.map((entry, i) => <p key={i}><span className="text-muted-foreground">[{entry.timestamp}]</span> {entry.role === "system" && <span className="text-muted-foreground">SYSTEM: {entry.text}</span>}{entry.role === "ai" && <><span className="text-foreground">PHOEBE:</span> &quot;{scrubPII(entry.text)}&quot;</>}{entry.role === "caller" && <><span className="text-accent">CALLER:</span> &quot;{scrubPII(entry.text)}&quot;</>}</p>)}</div></div>
              <div className="flex flex-col md:flex-row gap-4"><div className="glass p-4 font-mono text-[11px] overflow-hidden flex flex-col h-[280px] flex-1 min-w-0 rounded-lg"><div className="flex items-center gap-2 text-muted-foreground mb-2 border-b border-border/30 pb-2"><HardDrive size={12} /> AGENTIC_LOGIC_JSON</div><pre className="text-primary/70 text-[10px] flex-1 overflow-y-auto">{JSON.stringify({ session_active: callActive, agent: "Phoebe", transport: "PHAOS_SECURE_STREAM", call_duration: formatTime(callDuration), turns: transcript.filter((t) => t.role !== "system").length, latency_ms: latencyMs, connection_quality: highLatency ? "DEGRADED" : "OPTIMAL", structured_outputs: structuredOutputs, engine_state: isSpeaking ? "TTS_STREAMING" : "LISTENING" }, null, 2)}</pre></div><div className="glass p-4 h-[280px] w-full md:w-[260px] rounded-lg"><div className="flex items-center gap-2 text-muted-foreground mb-4 border-b border-border/30 pb-2 font-mono text-[11px]"><Mic size={12} /> NEURAL AUDIT TRAIL</div><div className="space-y-3 font-mono text-[10px]"><div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-primary" /> VAPI_WEBRTC_READY</div><div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-primary" /> ASSISTANT_BOUND</div><div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-primary" /> CARTESIA_VOICE_ACTIVE</div>{structuredOutputs.map((o) => <div key={o} className="flex items-center gap-2"><CheckCircle2 size={12} className="text-primary" /> {o}</div>)}</div></div></div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VoiceTestLive;