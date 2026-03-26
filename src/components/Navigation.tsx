import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import phaosCrown from "@/assets/phaos-crown.png";

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const links = [
    { label: "Product", to: "/" },
    { label: "Integrations", to: "/integrations" },
    { label: "About", to: "/" },
    { label: "Contact", to: "/" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={phaosCrown} alt="Phaos AI" className="h-8 w-auto object-contain" />
          <span className="text-lg font-bold tracking-tight text-foreground">PHAOS AI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-10 text-sm text-muted-foreground">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`hover:text-foreground transition-colors ${
                location.pathname === link.to && link.to !== "/" ? "text-foreground" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="hidden md:inline-flex bg-gradient-purple text-primary-foreground text-sm font-medium px-5 py-2 rounded-full glow-purple hover:opacity-90 transition-opacity"
          >
            Schedule a Call
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass-strong border-t border-border/50 px-6 py-4 space-y-4"
        >
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/"
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
