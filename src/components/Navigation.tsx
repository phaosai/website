import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import PhaosLogo from "@/components/PhaosLogo";
import ThemeToggle from "@/components/ThemeToggle";

type NavChild = { label: string; to: string };
type NavItem = { label: string; to?: string; children?: NavChild[] };

// LOCKED navigation structure — do not reorder, rename, or extend.
const NAV: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  {
    label: "Voice",
    children: [
      { label: "Voice Agent", to: "/voice-ai" },
      { label: "Integrations", to: "/integrations" },
      { label: "ROI Calculator", to: "/roi-calculator" },
    ],
  },
  {
    label: "Workflow",
    children: [{ label: "Workflow Automation", to: "/workflows" }],
  },
  {
    label: "ONE",
    children: [
      { label: "Aion", to: "/one/aion" },
      { label: "Sunesis", to: "/one/sunesis" },
      { label: "Kyrios", to: "/one/kyrios" },
      { label: "Investment Themes", to: "/app/sunesis/themes" },
      { label: "Run Simulation", to: "/one/run-simulation" },
    ],
  },
  { label: "Contact", to: "/contact" },
];

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Sticky + compact-on-scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close any open desktop dropdown when clicking outside
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  // Mobile menu focus trap + Esc
  useEffect(() => {
    if (!mobileOpen || !menuRef.current) return;
    const focusableEls = menuRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
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
      } else if (document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    firstEl.focus();
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname]);

  const isPathActive = (to?: string) => !!to && location.pathname === to;
  const isParentActive = (item: NavItem) =>
    isPathActive(item.to) ||
    !!item.children?.some((c) => location.pathname === c.to);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 glass-strong shadow-lg shadow-black/20 animate-fade-in transition-all"
      aria-label="Main navigation"
    >
      <div
        className={`max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between transition-all ${
          scrolled ? "h-14" : "h-16"
        }`}
      >
        <Link to="/" aria-label="Phaos AI Home">
          <PhaosLogo />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {NAV.map((item) => {
            const active = isParentActive(item);
            if (!item.children) {
              return (
                <Link
                  key={item.label}
                  to={item.to!}
                  aria-current={isPathActive(item.to) ? "page" : undefined}
                  className={`hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm ${
                    active ? "text-foreground" : ""
                  }`}
                >
                  {item.label}
                </Link>
              );
            }

            const isOpen = openMenu === item.label;
            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpenMenu(item.label)}
                onMouseLeave={() => setOpenMenu((cur) => (cur === item.label ? null : cur))}
              >
                <button
                  type="button"
                  onClick={() => setOpenMenu(isOpen ? null : item.label)}
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                  className={`inline-flex items-center gap-1 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm ${
                    active ? "text-foreground" : ""
                  }`}
                >
                  {item.label}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div
                    role="menu"
                    aria-label={`${item.label} submenu`}
                    className="absolute left-0 top-full pt-3"
                  >
                    <div className="min-w-[12rem] glass-strong border border-border/60 rounded-lg shadow-xl shadow-black/30 py-2 animate-fade-in">
                      {item.children.map((child) => {
                        const childActive = isPathActive(child.to);
                        return (
                          <Link
                            key={child.label}
                            to={child.to}
                            role="menuitem"
                            aria-current={childActive ? "page" : undefined}
                            onClick={() => setOpenMenu(null)}
                            className={`block px-4 py-2 text-sm hover:bg-muted/40 hover:text-foreground transition-colors ${
                              childActive ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
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
        <div
          ref={menuRef}
          id="mobile-nav-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
          className="md:hidden glass-strong border-t border-border/50 px-6 py-4 space-y-3 animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          {NAV.map((item) => {
            if (!item.children) {
              const active = isPathActive(item.to);
              return (
                <Link
                  key={item.label}
                  to={item.to!}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`block text-sm hover:text-foreground transition-colors ${
                    active ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }

            const expanded = !!mobileExpanded[item.label];
            const active = isParentActive(item);
            return (
              <div key={item.label} className="border-b border-border/40 pb-2 last:border-0">
                <button
                  type="button"
                  onClick={() =>
                    setMobileExpanded((s) => ({ ...s, [item.label]: !s[item.label] }))
                  }
                  aria-expanded={expanded}
                  className={`flex w-full items-center justify-between text-sm transition-colors ${
                    active ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {expanded && (
                  <div className="mt-2 ml-3 pl-3 border-l border-border/40 space-y-2">
                    {item.children.map((child) => {
                      const childActive = isPathActive(child.to);
                      return (
                        <Link
                          key={child.label}
                          to={child.to}
                          onClick={() => setMobileOpen(false)}
                          aria-current={childActive ? "page" : undefined}
                          className={`block text-sm hover:text-foreground transition-colors ${
                            childActive ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <Link
            to="/contact"
            onClick={() => setMobileOpen(false)}
            className="block bg-gradient-purple text-primary-foreground text-sm font-medium px-5 py-2 rounded-full text-center glow-purple"
          >
            Schedule a Call
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
