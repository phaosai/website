import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import phaosCrown from "@/assets/phaos-crown-transparent.png";

const SANDBOX_URL = "https://voice.phaosai.com/";

const WorkflowTeardownPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Auto-open 1.5s after load on public routes (matches global UI delay).
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const suppressedRoutes = ["/pricing", "/auth", "/checkout", "/billing"];
    if (suppressedRoutes.some((p) => path.startsWith(p))) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
      setMinimized(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setIsOpen(false);
    setMinimized(true);
  };

  const reopen = () => {
    setIsOpen(true);
    setMinimized(false);
  };

  const launchSandbox = () => {
    window.open(SANDBOX_URL, "_blank", "noopener,noreferrer");
    dismiss();
  };

  // Responsive values
  const scale = isMobile ? 0.95 : 1;
  const maxW = isMobile ? "max-w-lg" : "max-w-xl";
  const heroPx = isMobile ? "px-6 pt-8 pb-6" : "px-10 pt-12 pb-8";
  const bodyPx = isMobile ? "px-6 pb-6 pt-2" : "px-10 pb-10 pt-2";
  const headingSize = isMobile ? "text-xl" : "text-2xl sm:text-3xl";
  const badgeSize = isMobile ? "text-[11px]" : "text-xs";
  const btnPy = isMobile ? "py-3.5 text-sm" : "py-4 text-base";
  const purple = "#B97AFF";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale, opacity: 1, y: 0 }}
            exit={{ scale: 0.6, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full ${maxW} rounded-3xl overflow-hidden border origin-center`}
            style={{
              background: "linear-gradient(180deg, #161225 0%, #0b0b0f 100%)",
              borderColor: "rgba(138,43,226,0.25)",
              boxShadow: "0 0 80px rgba(138,43,226,0.25), 0 30px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.5)" }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Hero Banner */}
            <div className={`relative ${heroPx} text-center`}>
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] pointer-events-none"
                style={{ background: "rgba(138,43,226,0.18)" }}
              />
              <img
                src={phaosCrown}
                alt=""
                width={isMobile ? 96 : 144}
                height={isMobile ? 48 : 72}
                className="mx-auto mb-5 relative z-10 drop-shadow-[0_0_20px_rgba(138,43,226,0.4)]"
                aria-hidden="true"
                loading="eager"
              />
              <div className="relative z-10">
                <span
                  className={`inline-block ${badgeSize} font-bold uppercase tracking-[0.25em] mb-3 px-4 py-1.5 rounded-full`}
                  style={{
                    color: "#FFFFFF",
                    background: "rgba(138,43,226,0.25)",
                    border: "1px solid rgba(138,43,226,0.4)",
                  }}
                >
                  Free Live Voice Demo
                </span>
                <h2 className={`${headingSize} font-extrabold text-white leading-tight flex flex-col items-center my-6`}>
                  <span>This Is What A <span style={{ color: purple }}>World-Class</span></span>
                  <span>Fully Integrated Customer</span>
                  <span>Experience <span style={{ color: purple }}>Sounds Like</span></span>
                </h2>
              </div>
            </div>

            {/* Body */}
            <div className={bodyPx}>
              {/* Value prop */}
              <div
                className="flex items-start gap-4 rounded-2xl p-4 mb-6"
                style={{
                  background: "rgba(138,43,226,0.06)",
                  border: "1px solid rgba(138,43,226,0.12)",
                }}
              >
                <Zap className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: purple }} />
                <div>
                  <p className={`${isMobile ? "text-sm" : "text-base"} font-semibold text-white mb-1`}>
                    Personally experience your customer&rsquo;s new reality!
                  </p>
                  <p className={`${isMobile ? "text-xs" : "text-sm"} text-white/55 leading-snug`}>
                    THIS is what AI was built for!
                  </p>
                  <p className={`${isMobile ? "text-xs" : "text-sm"} text-white/55 leading-snug mt-1`}>
                    Personalization, revenue generation, enhanced communication, RevOps + Marketing.
                  </p>
                  <p className={`${isMobile ? "text-xs" : "text-sm"} text-white/55 leading-snug mt-1`}>
                    No friction. Pure growth. Staff refocused.
                  </p>
                  <p className={`${isMobile ? "text-xs" : "text-sm"} text-white/55 leading-snug mt-1`}>
                    The powerhouse differentiator you&rsquo;ve been seeking.
                  </p>
                </div>
              </div>

              <button
                onClick={launchSandbox}
                className={`w-full flex items-center justify-center gap-2 rounded-xl ${btnPy} font-semibold text-white transition-all hover:opacity-90 group`}
                style={{
                  background: "linear-gradient(135deg, #8A2BE2, #6B21A8)",
                  boxShadow: "0 0 25px rgba(138,43,226,0.35)",
                }}
              >
                Try It Now Free!
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Minimized reopen button */}
      {minimized && !isOpen && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={reopen}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[99] flex items-center gap-2 px-3 py-3 rounded-l-xl shadow-lg cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #8A2BE2, #6B21A8)",
            boxShadow: "0 0 25px rgba(138,43,226,0.4)",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
          }}
          aria-label="Try Voice AI Live"
        >
          <Zap className="w-4 h-4 text-white rotate-90" />
          <span className="text-[11px] font-bold text-white tracking-wider uppercase">Try Voice AI Live</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default WorkflowTeardownPopup;
