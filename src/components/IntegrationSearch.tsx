import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Check, Webhook } from "lucide-react";

interface SearchableIntegration {
  name: string;
  type: "native" | "webhook";
}

const searchList: SearchableIntegration[] = [
  // Major CRMs (20)
  { name: "Salesforce", type: "native" },
  { name: "HubSpot", type: "native" },
  { name: "Close CRM", type: "native" },
  { name: "Zoho CRM", type: "native" },
  { name: "Pipedrive", type: "native" },
  { name: "Freshsales", type: "native" },
  { name: "Monday CRM", type: "native" },
  { name: "Copper CRM", type: "native" },
  { name: "Insightly", type: "native" },
  { name: "Nimble", type: "native" },
  { name: "Keap (Infusionsoft)", type: "native" },
  { name: "ActiveCampaign", type: "native" },
  { name: "Zendesk Sell", type: "native" },
  { name: "Nutshell", type: "native" },
  { name: "Agile CRM", type: "native" },
  { name: "Capsule CRM", type: "native" },
  { name: "Less Annoying CRM", type: "native" },
  { name: "Bitrix24", type: "native" },
  { name: "SugarCRM", type: "native" },
  { name: "Microsoft Dynamics 365", type: "native" },
  // Print-specific ERPs/DCAs (10)
  { name: "ECI e-automate", type: "webhook" },
  { name: "SalesChain", type: "webhook" },
  { name: "PrintFleet", type: "webhook" },
  { name: "FMAudit", type: "webhook" },
  { name: "Print Tracker", type: "webhook" },
  { name: "Tigerpaw", type: "webhook" },
  { name: "ConnectWise Manage", type: "webhook" },
  { name: "Syncro MSP", type: "webhook" },
  { name: "PaperCut MF", type: "webhook" },
  { name: "ezeep Blue", type: "webhook" },
];

const IntegrationSearch = () => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim().toLowerCase();
  const results = trimmed.length > 0
    ? searchList.filter((i) => i.name.toLowerCase().includes(trimmed))
    : [];
  const showDropdown = isFocused && trimmed.length > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <section className="py-16 px-6">
      <div className="max-w-2xl mx-auto" ref={containerRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Can Phaos Connect to <span className="text-gradient-purple">Your Stack</span>?
          </h2>
          <p className="text-muted-foreground">Search for any app, CRM, or platform below.</p>
        </motion.div>

        <div className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder="Search integrations — e.g. Salesforce, e-automate, PrintFleet…"
              className="w-full pl-12 pr-10 py-4 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none text-foreground placeholder:text-muted-foreground transition-all text-base"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="absolute z-50 mt-2 w-full rounded-2xl bg-card/90 backdrop-blur-2xl border border-border/50 shadow-2xl shadow-primary/5 overflow-hidden max-h-80 overflow-y-auto"
              >
                {results.length > 0 ? (
                  results.map((item) => (
                    <div key={item.name} className="flex items-center justify-between px-5 py-3.5 hover:bg-primary/5 transition-colors border-b border-border/20 last:border-b-0">
                      <span className="text-foreground font-medium">{item.name}</span>
                      {item.type === "native" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          <Check className="w-3 h-3" />
                          Native Zapier Integration
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                          <Webhook className="w-3 h-3" />
                          Phaos Universal Webhook
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-6 text-center">
                    <p className="text-muted-foreground mb-3">
                      We can't find that in the standard directory, but Phaos AI can likely connect via Webhook.
                    </p>
                    <a
                      href="/contact"
                      className="inline-flex items-center gap-2 bg-primary/15 hover:bg-primary/25 text-primary font-semibold px-5 py-2 rounded-full border border-primary/20 transition-colors text-sm"
                    >
                      Request Compatibility Check
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default IntegrationSearch;
