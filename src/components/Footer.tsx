import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-16 px-6 border-t border-border/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand — text only, aligned like other column headers */}
          <div className="md:col-span-1">
            <p className="text-sm font-semibold text-foreground mb-4 tracking-wide uppercase">PHAOS AI</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-Powered Voice & Agentic Workflow Automation for the modern enterprise.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-4 tracking-wide uppercase">Product</p>
            <ul className="space-y-3">
              {["Voice AI Agents", "Agentic Workflows", "Analytics", "Integrations", "Security"].map((link) => (
                <li key={link}>
                  <Link
                    to={link === "Integrations" ? "/integrations" : "/"}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-4 tracking-wide uppercase">Company</p>
            <ul className="space-y-3">
              {["About", "Careers", "Partners", "Investors", "Contact"].map((link) => (
                <li key={link}>
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{link}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-4 tracking-wide uppercase">Get in Touch</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Info@PhaosAI.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">(617) 678-2426</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Casselberry, Florida USA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 Phaos AI. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
