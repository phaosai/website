import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot, User, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useLocation } from "react-router-dom";
import phaosCrown from "@/assets/phaos-crown.jpg";
import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/phaos-chat`;
const SUGGESTED_PROMPTS = [
  "How can AI handle my inbound calls 24/7?",
  "What ROI can I expect from Voice AI?",
  "How does workflow automation reduce labor costs?",
  "Can Phaos AI integrate with my CRM?",
  "What industries does Phaos AI serve?",
  "How quickly can I get started?",
  "Tell me about your Voice AI agents",
  "How do you handle after-hours calls?",
  "What's the difference between AI and a call center?",
  "Can you automate our lead follow-up process?",
  "How does AI reduce missed call revenue loss?",
  "What integrations are available?",
];

async function streamChat({
  messages,
  currentPage,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  currentPage?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, currentPage }),
    });

    if (!resp.ok || !resp.body) {
      if (resp.status === 429) {
        onError("We're experiencing high demand right now. Please try again in a moment.");
        return;
      }
      if (resp.status === 402) {
        onError("Our service is temporarily unavailable. Please email us at daniel@phaosai.com");
        return;
      }
      onError("Something went wrong. Please try again or reach us at daniel@phaosai.com");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch {
    onError("Connection error. Please try again or contact daniel@phaosai.com");
  }
}

const ChatWidget = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [showCTA, setShowCTA] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Check if CTA should appear
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant") {
      const nums = lastMsg.content.match(/\$[\d,]+/g);
      if (nums) {
        const hasHighValue = nums.some(n => {
          const val = parseInt(n.replace(/[$,]/g, ""), 10);
          return val >= 10000;
        });
        if (hasHighValue && !showCTA) setShowCTA(true);
      }
    }
  }, [messages, showCTA]);

  const sendMessage = useCallback(async (overrideInput?: string) => {
    const msgText = overrideInput || input.trim();
    if (!msgText || isLoading) return;

    const userMsg: Message = { role: "user", content: msgText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Lead capture on email/phone detection
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(msgText);
    const hasPhone = /[\d\s()-]{7,}/.test(msgText);
    if ((hasEmail || hasPhone) && !leadCaptured) {
      const emailMatch = msgText.match(/[\w.-]+@[\w.-]+\.\w+/);
      const phoneMatch = msgText.match(/[\d\s()+.-]{7,}/);
      try {
        const transcript = newMessages
          .map((m) => `${m.role === "user" ? "Visitor" : "Phaos AI"}: ${m.content}`)
          .join("\n");
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "lead-notification",
            recipientEmail: "daniel@phaosai.com",
            idempotencyKey: `chat-lead-${Date.now()}`,
            templateData: {
              source: "Chat Widget",
              email: emailMatch?.[0] || "",
              phone: phoneMatch?.[0] || "",
              message: transcript,
            },
          },
        });
        setLeadCaptured(true);
      } catch (e) {
        console.error("Lead capture failed:", e);
      }
    }

    let assistantSoFar = "";
    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
      currentPage: location.pathname,
      onDelta: upsertAssistant,
      onDone: () => setIsLoading(false),
      onError: (err) => {
        setMessages((prev) => [...prev, { role: "assistant", content: err }]);
        setIsLoading(false);
      },
    });
  }, [input, isLoading, messages, leadCaptured, location.pathname]);

  const hasStarted = messages.length > 0;

  return (
    <>
      {/* Floating Bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setIsOpen(true); setShowPulse(false); }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-shadow"
            style={{ background: "#8A2BE2", boxShadow: "0 0 20px rgba(138,43,226,0.4)" }}
            aria-label="Open Chat"
          >
            {showPulse && (
              <>
                <span className="absolute -inset-4 rounded-full animate-ping" style={{ background: "rgba(138,43,226,0.2)", animationDuration: "1.5s" }} />
                <span className="absolute -inset-8 rounded-full animate-ping" style={{ background: "rgba(138,43,226,0.1)", animationDuration: "2s", animationDelay: "0.3s" }} />
                <span className="absolute -inset-12 rounded-full animate-ping" style={{ background: "rgba(138,43,226,0.05)", animationDuration: "2.5s", animationDelay: "0.6s" }} />
                <span className="absolute -inset-16 rounded-full animate-ping" style={{ background: "rgba(138,43,226,0.03)", animationDuration: "3s", animationDelay: "0.9s" }} />
              </>
            )}
            <MessageCircle className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-3rem)] flex flex-col rounded-2xl overflow-hidden border shadow-2xl"
            style={{
              background: "#0b0b0f",
              borderColor: "rgba(138,43,226,0.3)",
              boxShadow: "0 0 40px rgba(138,43,226,0.15)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "rgba(138,43,226,0.2)", background: "rgba(138,43,226,0.05)" }}>
              <div className="relative">
                <img src={phaosCrown} alt="Phaos AI" className="w-8 h-8 object-contain" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: "#00FF41", borderColor: "#0b0b0f" }} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">Phaos AI | Operations Consultant</h3>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Online • Ready to help</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: "rgba(255,255,255,0.5)" }}
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: "#0b0b0f" }}>
              {/* Suggested Prompts - shown before any messages */}
              {!hasStarted && !isLoading && (
                <div className="space-y-3">
                  <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>Ask us anything — here are some ideas:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <motion.button
                        key={prompt}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => sendMessage(prompt)}
                        className="rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 text-left"
                        style={{
                          background: "rgba(138,43,226,0.1)",
                          border: "1px solid rgba(138,43,226,0.25)",
                          color: "#c084fc",
                        }}
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: msg.role === "assistant" ? "rgba(138,43,226,0.2)" : "rgba(255,255,255,0.1)" }}
                  >
                    {msg.role === "assistant" ? (
                      <Bot className="w-3.5 h-3.5" style={{ color: "#8A2BE2" }} />
                    ) : (
                      <User className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
                    )}
                  </div>
                  <div
                    className={`max-w-[270px] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "assistant" ? "rounded-tl-sm" : "rounded-tr-sm"
                    }`}
                    style={{
                      background: msg.role === "assistant" ? "rgba(255,255,255,0.06)" : "#8A2BE2",
                      color: "white",
                    }}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-1 [&>ol]:my-1 [&>li]:my-0 [&_strong]:text-[#00FF41]">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {/* High-Value CTA */}
              {showCTA && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mx-10"
                >
                  <a
                    href="/contact"
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 group"
                    style={{ background: "linear-gradient(135deg, #8A2BE2, #6B21A8)", boxShadow: "0 0 20px rgba(138,43,226,0.3)" }}
                  >
                    Schedule a Call
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </motion.div>
              )}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(138,43,226,0.2)" }}>
                    <Bot className="w-3.5 h-3.5" style={{ color: "#8A2BE2" }} />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t" style={{ borderColor: "rgba(138,43,226,0.2)", background: "rgba(255,255,255,0.02)" }}>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type your question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={isLoading}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(138,43,226,0.2)" }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ background: "#8A2BE2" }}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-center mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                Powered by Phaos AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
