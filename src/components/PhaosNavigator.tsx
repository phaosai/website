import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, X } from "lucide-react";

interface Shortcut {
  label: string;
  target: string; // CSS selector or route
  route?: string; // if different page
}

const pageShortcuts: Record<string, Shortcut[]> = {
  "/": [
    { label: "Voice AI", target: "/voice-ai", route: "/voice-ai" },
    { label: "Workflows", target: "/workflows", route: "/workflows" },
    { label: "ROI Calculator", target: "[aria-label='ROI Calculator']" },
    { label: "Contact", target: "/contact", route: "/contact" },
  ],
  "/integrations": [
    { label: "Search Integrations", target: "#integration-search" },
    { label: "How It Works", target: "[aria-label='Voice AI + Integrations'], section:nth-of-type(3)" },
    { label: "Contact", target: "/contact", route: "/contact" },
  ],
  "/voice-ai": [
    { label: "Capabilities", target: "[aria-label='Voice AI Capabilities']" },
    { label: "Use Cases", target: "[aria-label='Use Cases']" },
    { label: "Contact", target: "/contact", route: "/contact" },
  ],
  "/workflows": [
    { label: "Capabilities", target: "[aria-label='Workflow Capabilities']" },
    { label: "Examples", target: "[aria-label='Workflow Examples']" },
    { label: "Contact", target: "/contact", route: "/contact" },
  ],
};

const defaultShortcuts: Shortcut[] = [
  { label: "Home", target: "/", route: "/" },
  { label: "ROI Calculator", target: "/roi-calculator", route: "/roi-calculator" },
  { label: "Contact", target: "/contact", route: "/contact" },
];

const PhaosNavigator = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const shortcuts = pageShortcuts[location.pathname] || defaultShortcuts;

  const handleShortcut = useCallback(
    (shortcut: Shortcut) => {
      setOpen(false);

      if (shortcut.route && shortcut.route !== location.pathname) {
        navigate(shortcut.route);
        return;
      }

      // Scroll to element on current page
      setTimeout(() => {
        const el = document.querySelector(shortcut.target);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          // Pulse highlight
          el.classList.add("ring-2", "ring-primary", "rounded-2xl");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-primary", "rounded-2xl");
          }, 1500);
        }
      }, 100);
    },
    [location.pathname, navigate]
  );

  return (
    <div className="fixed bottom-6 left-6 z-40" style={{ willChange: "transform" }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-14 left-0 bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl p-3 min-w-[180px] shadow-2xl shadow-black/40"
          >
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider px-3 py-1.5">
              Navigate
            </p>
            {shortcuts.map((s) => (
              <button
                key={s.label}
                onClick={() => handleShortcut(s)}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
              >
                {s.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        className="w-11 h-11 rounded-full bg-card/90 backdrop-blur-xl border border-border/50 flex items-center justify-center shadow-lg shadow-black/30 hover:border-primary/40 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? "Close navigator" : "Open navigator"}
        data-interactive
      >
        {open ? (
          <X className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Compass className="w-4 h-4 text-primary" />
        )}
      </motion.button>
    </div>
  );
};

export default PhaosNavigator;
