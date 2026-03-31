import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import phaosCrown from "@/assets/phaos-crown.png";

const WorkflowTeardownPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [bottleneck, setBottleneck] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    const dismissed = sessionStorage.getItem("phaos-popup-dismissed");
    if (dismissed) return;

    const timer = setTimeout(() => setIsOpen(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem("phaos-popup-dismissed", "1");
  };

  const validateEmail = (val: string) => {
    if (!val.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Enter a valid email";
    if (/@(gmail|yahoo|hotmail|outlook|aol|icloud)\./i.test(val))
      return "Please use your work email for a professional assessment";
    return "";
  };

  const handleStep1 = () => {
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    setEmailError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const id = crypto.randomUUID();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "lead-notification",
          recipientEmail: "daniel@phaosai.com",
          idempotencyKey: `teardown-${id}`,
          templateData: {
            source: "Workflow Teardown Popup",
            name: "Popup Lead",
            message: `Work Email: ${email}\n\nBiggest Manual Bottleneck: ${bottleneck || "Not provided"}`,
          },
        },
      });
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden border"
            style={{
              background: "linear-gradient(180deg, #12101e 0%, #0b0b0f 100%)",
              borderColor: "rgba(138,43,226,0.3)",
              boxShadow: "0 0 60px rgba(138,43,226,0.2), 0 25px 50px rgba(0,0,0,0.5)",
            }}
          >
            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.5)" }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Hero Banner */}
            <div
              className="relative px-6 pt-8 pb-6 text-center"
              style={{ background: "linear-gradient(135deg, rgba(138,43,226,0.15), rgba(138,43,226,0.05))" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-[80px] pointer-events-none"
                style={{ background: "rgba(138,43,226,0.2)" }}
              />
              <img src={phaosCrown} alt="Phaos AI" className="w-12 h-12 mx-auto mb-3 object-contain relative z-10" />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "#8A2BE2" }}>
                  Free Workflow Teardown
                </p>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight mb-2">
                  Send Us Your Messiest<br />
                  <span style={{ color: "#8A2BE2" }}>Manual Workflow</span>
                </h2>
                <p className="text-sm text-white/60 leading-relaxed">
                  We'll map the AI solution — <span className="font-semibold text-white/90">completely free</span>.
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 pb-6 pt-4">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#00FF41" }} />
                  <h3 className="text-lg font-bold text-white mb-2">You're In!</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Our team will review your workflow and send back a personalized AI solution map within 48 hours.
                  </p>
                  <button
                    onClick={dismiss}
                    className="mt-4 text-sm font-medium transition-colors hover:text-white"
                    style={{ color: "#8A2BE2" }}
                  >
                    Close
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* What you get */}
                  <div className="flex items-start gap-3 rounded-xl p-3 mb-5"
                    style={{ background: "rgba(138,43,226,0.08)", border: "1px solid rgba(138,43,226,0.15)" }}
                  >
                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#8A2BE2" }} />
                    <div>
                      <p className="text-xs font-semibold text-white mb-0.5">15-Minute Workflow Teardown</p>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        You describe your manual process. We send back a detailed AI solution map showing exactly how automation handles it.
                      </p>
                    </div>
                  </div>

                  {step === 1 ? (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1.5">
                          Work Email Address <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                          placeholder="you@company.com"
                          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: emailError ? "1px solid #ef4444" : "1px solid rgba(138,43,226,0.2)",
                          }}
                          onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                        />
                        {emailError && (
                          <p className="text-xs mt-1 text-red-400">{emailError}</p>
                        )}
                      </div>
                      <button
                        onClick={handleStep1}
                        disabled={!email.trim()}
                        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed group"
                        style={{ background: "linear-gradient(135deg, #8A2BE2, #6B21A8)", boxShadow: "0 0 20px rgba(138,43,226,0.3)" }}
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1.5">
                          What's your biggest manual bottleneck? <span className="text-white/30">(Optional)</span>
                        </label>
                        <textarea
                          value={bottleneck}
                          onChange={(e) => setBottleneck(e.target.value)}
                          placeholder="e.g. 'We manually process 200+ invoices per week' or 'Our team spends 3 hours daily answering the same support calls...'"
                          rows={3}
                          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 resize-none"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(138,43,226,0.2)",
                          }}
                        />
                        <p className="text-[10px] mt-1 text-white/30">This helps us build a more tailored solution map.</p>
                      </div>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: "linear-gradient(135deg, #8A2BE2, #6B21A8)", boxShadow: "0 0 20px rgba(138,43,226,0.3)" }}
                      >
                        {submitting ? "Submitting..." : "Get My Free Teardown"}
                      </button>
                      <button
                        onClick={() => setStep(1)}
                        className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors"
                      >
                        ← Back
                      </button>
                    </motion.div>
                  )}

                  <p className="text-[10px] text-center text-white/20 mt-4">
                    No spam. No obligation. Just a clear AI solution map.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorkflowTeardownPopup;
