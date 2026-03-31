import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import PhaosLogo from "@/components/PhaosLogo";
import ThemeToggle from "@/components/ThemeToggle";

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus trap for mobile menu
  useEffect(() => {
    if (!mobileOpen || !menuRef.current) return;

    const focusableEls = menuRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    if (focusableEls.length === 0) return;

    const firstEl = focusableEls[0];
    const lastEl = focusableEls[focusableEls.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    firstEl.focus();
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const links = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Integrations", to: "/integrations" },
    { label: "ROI Calculator", to: "/roi-calculator" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong shadow-lg shadow-black/20"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" aria-label="Phaos AI Home">
          <PhaosLogo />
        </Link>

        <div className="hidden md:flex items-center gap-10 text-sm text-muted-foreground">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.label}
                to={link.to}
                aria-current={isActive ? "page" : undefined}
                className={`hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm ${
                  isActive ? "text-foreground" : ""
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/contact"
            className="hidden md:inline-flex bg-gradient-purple text-primary-foreground text-sm font-medium px-5 py-2 rounded-full glow-purple hover:opacity-90 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Schedule a Call
          </Link>

          <button
            className="md:hidden text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          ref={menuRef}
          id="mobile-nav-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass-strong border-t border-border/50 px-6 py-4 space-y-4"
        >
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`block text-sm hover:text-foreground transition-colors ${
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/contact"
            onClick={() => setMobileOpen(false)}
            className="block bg-gradient-purple text-primary-foreground text-sm font-medium px-5 py-2 rounded-full text-center glow-purple"
          >
            Schedule a Call
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navigation;
