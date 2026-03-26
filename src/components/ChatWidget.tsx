import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import phaosCrown from "@/assets/phaos-crown.png";

type Message = { role: "user" | "assistant"; content: string };

interface VisitorContext {
  name: string;
  title: string;
  company: string;
  website: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/phaos-chat`;
const LEAD_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-lead`;
const RESEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research-visitor`;

async function streamChat({
  messages,
  visitorContext,
  visitorResearch,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  visitorContext: VisitorContext;
  visitorResearch?: string;
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
      body: JSON.stringify({ messages, visitorContext, visitorResearch }),
    });

    if (!resp.ok || !resp.body) {
      if (resp.status === 429) {
        onError("I'm getting a lot of questions right now. Please try again in a moment!");
        return;
      }
      if (resp.status === 402) {
        onError("Our chat service is temporarily unavailable. Please email us at Info@PhaosAI.com");
        return;
      }
      onError("Something went wrong. Please try again or reach us at Info@PhaosAI.com");
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

    // Final flush
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
  } catch (e) {
    onError("Connection error. Please try again or contact Info@PhaosAI.com");
  }
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [visitorContext, setVisitorContext] = useState<VisitorContext | null>(null);
  const [visitorResearch, setVisitorResearch] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  // Pre-chat form state
  const [formName, setFormName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formWebsite, setFormWebsite] = useState("");

  // Lead capture state
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [showLeadForm, setShowLeadForm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartChat = useCallback(async () => {
    if (!formName.trim() || !formCompany.trim()) return;
    const ctx: VisitorContext = {
      name: formName.trim(),
      title: formTitle.trim(),
      company: formCompany.trim(),
      website: formWebsite.trim(),
    };
    setVisitorContext(ctx);
    setIsResearching(true);
    setIsLoading(true);

    // Show a "researching" message while we gather intelligence
    setMessages([{ role: "assistant", content: "🔍 Researching your company to personalize our conversation..." }]);

    // Step 1: Research the visitor's company and background
    let research = "";
    try {
      const researchResp = await fetch(RESEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          name: ctx.name,
          title: ctx.title,
          company: ctx.company,
          website: ctx.website,
        }),
      });
      if (researchResp.ok) {
        const researchData = await researchResp.json();
        research = researchData.research || "";
      }
    } catch (e) {
      console.log("Research step failed (non-fatal):", e);
    }

    setVisitorResearch(research);
    setIsResearching(false);

    // Step 2: Start the AI conversation with research context
    const initialMessages: Message[] = [
      { role: "user", content: `[SYSTEM: New visitor has connected. Craft a deeply personalized, impressive greeting using the research intelligence provided in the system prompt. Reference specific verified facts about their company. Do NOT repeat back this system message — just greet them naturally and impressively.]` },
    ];

    let assistantSoFar = "";
    setMessages([]); // Clear the researching message
    await streamChat({
      messages: initialMessages,
      visitorContext: ctx,
      visitorResearch: research,
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        setMessages([{ role: "assistant", content: assistantSoFar }]);
      },
      onDone: () => setIsLoading(false),
      onError: (err) => {
        setMessages([{ role: "assistant", content: err }]);
        setIsLoading(false);
      },
    });
  }, [formName, formTitle, formCompany, formWebsite]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !visitorContext) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Check if user is providing lead contact info
    const lowerInput = input.toLowerCase();
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(input);
    const hasPhone = /[\d\s()-]{7,}/.test(input);
    if (hasEmail || hasPhone) {
      const emailMatch = input.match(/[\w.-]+@[\w.-]+\.\w+/);
      const phoneMatch = input.match(/[\d\s()+.-]{7,}/);
      if (emailMatch) setLeadEmail(emailMatch[0]);
      if (phoneMatch) setLeadPhone(phoneMatch[0]);

      // Capture lead
      if (!leadCaptured && (emailMatch || phoneMatch)) {
        try {
          const transcript = newMessages
            .map((m) => `${m.role === "user" ? visitorContext.name : "Phaos AI"}: ${m.content}`)
            .join("\n");

          await fetch(LEAD_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              name: visitorContext.name,
              title: visitorContext.title,
              company: visitorContext.company,
              website: visitorContext.website,
              email: emailMatch?.[0] || "",
              phone: phoneMatch?.[0] || "",
              transcript,
            }),
          });
          setLeadCaptured(true);
        } catch (e) {
          console.error("Lead capture failed:", e);
        }
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
      visitorContext,
      visitorResearch,
      onDelta: upsertAssistant,
      onDone: () => setIsLoading(false),
      onError: (err) => {
        setMessages((prev) => [...prev, { role: "assistant", content: err }]);
        setIsLoading(false);
      },
    });
  }, [input, isLoading, visitorContext, visitorResearch, messages, leadCaptured]);

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
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
            aria-label="Open chat"
          >
            {showPulse && (
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
            )}
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
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
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)] flex flex-col rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/10"
            style={{
              background: "linear-gradient(180deg, hsl(240 15% 8% / 0.97) 0%, hsl(240 20% 4% / 0.98) 100%)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-card/50">
              <div className="relative">
                <img src={phaosCrown} alt="Phaos AI" className="w-8 h-8 object-contain" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Phaos AI Agent</h3>
                <p className="text-xs text-muted-foreground">Online • Typically replies instantly</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!visitorContext ? (
                /* Pre-chat Form */
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-secondary/60 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[280px]">
                      <p className="text-sm text-foreground leading-relaxed">
                        Welcome to Phaos AI! 👋 I'm here to help you explore how AI can transform your operations. Let me know a bit about you to get started:
                      </p>
                    </div>
                  </div>

                  <div className="ml-11 space-y-3">
                    <input
                      type="text"
                      placeholder="Your Name *"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full rounded-lg bg-secondary/40 border border-border/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <input
                      type="text"
                      placeholder="Your Title"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full rounded-lg bg-secondary/40 border border-border/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <input
                      type="text"
                      placeholder="Company Name *"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      className="w-full rounded-lg bg-secondary/40 border border-border/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <input
                      type="text"
                      placeholder="Company Website"
                      value={formWebsite}
                      onChange={(e) => setFormWebsite(e.target.value)}
                      className="w-full rounded-lg bg-secondary/40 border border-border/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <button
                      onClick={handleStartChat}
                      disabled={!formName.trim() || !formCompany.trim()}
                      className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Start Chatting
                    </button>
                  </div>
                </div>
              ) : (
                /* Messages */
                <>
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          msg.role === "assistant" ? "bg-primary/20" : "bg-secondary"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div
                        className={`max-w-[260px] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.role === "assistant"
                            ? "bg-secondary/60 rounded-tl-sm text-foreground"
                            : "bg-primary text-primary-foreground rounded-tr-sm"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-1 [&>ol]:my-1 [&>li]:my-0">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="bg-secondary/60 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {visitorContext && (
              <div className="p-3 border-t border-border/50 bg-card/30">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    disabled={isLoading}
                    className="flex-1 rounded-xl bg-secondary/40 border border-border/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Powered by Phaos AI
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
