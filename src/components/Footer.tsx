import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const productLinks = [
    { label: "Voice AI Agents", to: "/voice-ai" },
    { label: "Agentic Workflows", to: "/workflows" },
    { label: "Integrations", to: "/integrations" },
    { label: "Security", to: "/security" },
  ];

  const companyLinks = [
    { label: "About", to: "/about" },
    { label: "Careers", to: "/careers" },
    { label: "Partners", to: "/partners" },
    { label: "Investors", to: "/investors" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <footer className="py-16 px-6 border-t border-border/30" aria-label="Site footer">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <p className="text-sm font-semibold text-foreground mb-4 tracking-wide uppercase">
              <span className="font-bold">Phaos</span>{" "}
              <span className="italic font-medium text-purple-light">AI</span>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-Powered Voice & Agentic Workflow Automation for the modern enterprise.
            </p>
          </div>

          <nav aria-label="Product links">
            <p className="text-sm font-semibold text-foreground mb-4 tracking-wide uppercase">Product</p>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company links">
            <p className="text-sm font-semibold text-foreground mb-4 tracking-wide uppercase">Company</p>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-sm font-semibold text-foreground mb-4 tracking-wide uppercase">Get in Touch</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" aria-hidden="true" />
                <a href="mailto:info@phaosai.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">info@phaosai.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" aria-hidden="true" />
                <a href="tel:+16176782426" className="text-sm text-muted-foreground hover:text-foreground transition-colors">(617) 678-2426</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">Casselberry, FL USA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">© 2026 Phaos AI. All rights reserved.</p>
            <p className="text-xs text-muted-foreground italic">Phaos — Greek for "light." Guided by faith, built with purpose.</p>
          </div>
          <nav aria-label="Legal links" className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
