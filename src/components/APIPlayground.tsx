import { useState, useCallback } from "react";
import { motion } from "framer-motion";

const REQUEST_CMD = `curl -X POST https://api.phaosai.com/v1/deploy \\
  -H "Authorization: Bearer pk_live_•••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_type": "voice_ai",
    "industry": "copier_dealership",
    "integrations": ["connectwise", "google_calendar"]
  }'`;

const RESPONSE_JSON = `{
  "status": "AI_Agent_Deployed",
  "agent_id": "phaos_va_8f42b1c3",
  "latency_ms": 42,
  "monthly_savings": "$3,200",
  "integrations_active": 2,
  "message": "Voice AI agent is live and accepting calls."
}`;

const APIPlayground = () => {
  const [ran, setRan] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [typing, setTyping] = useState(false);

  const runSimulation = useCallback(() => {
    if (typing) return;
    setRan(false);
    setDisplayedResponse("");
    setTyping(true);

    let i = 0;
    const interval = setInterval(() => {
      setDisplayedResponse(RESPONSE_JSON.slice(0, i + 1));
      i++;
      if (i >= RESPONSE_JSON.length) {
        clearInterval(interval);
        setRan(true);
        setTyping(false);
      }
    }, 8);
  }, [typing]);

  return (
    <div className="rounded-2xl border border-border/50 overflow-hidden bg-[hsl(240,20%,6%)]">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[hsl(240,15%,8%)] border-b border-border/30">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[hsl(0,70%,55%)]" />
          <span className="w-3 h-3 rounded-full bg-[hsl(45,80%,55%)]" />
          <span className="w-3 h-3 rounded-full bg-[hsl(142,70%,45%)]" />
        </div>
        <span className="text-xs text-muted-foreground font-mono ml-2">phaos-api-playground</span>
      </div>

      {/* Code area */}
      <div className="p-5 font-mono text-sm leading-relaxed">
        <p className="text-muted-foreground text-xs mb-3">$ Request</p>
        <pre className="text-foreground/80 whitespace-pre-wrap break-all text-xs sm:text-sm">
          {REQUEST_CMD}
        </pre>

        {(ran || typing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6"
          >
            <p className="text-muted-foreground text-xs mb-3">$ Response</p>
            <pre className="text-success whitespace-pre-wrap break-all text-xs sm:text-sm">
              {displayedResponse}
              {typing && <span className="animate-pulse">▋</span>}
            </pre>
          </motion.div>
        )}
      </div>

      {/* Run button */}
      <div className="px-5 pb-5">
        <button
          onClick={runSimulation}
          disabled={typing}
          className="bg-gradient-purple text-primary-foreground font-medium text-sm px-6 py-2.5 rounded-full glow-purple hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50"
          data-interactive
        >
          {typing ? "Running..." : ran ? "Run Again" : "Test Request"}
        </button>
      </div>
    </div>
  );
};

export default APIPlayground;
