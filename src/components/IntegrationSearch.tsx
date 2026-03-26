import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Check, Webhook, AlertCircle } from "lucide-react";

type IntegrationType = "zapier" | "webhook" | "contact";

interface SearchableIntegration {
  name: string;
  type: IntegrationType;
}

const searchList: SearchableIntegration[] = [
  // === ZAPIER FULL INTEGRATION (Green) — Mainstream apps with Zapier triggers ===
  // CRMs
  { name: "Salesforce", type: "zapier" },
  { name: "HubSpot", type: "zapier" },
  { name: "Close CRM", type: "zapier" },
  { name: "Zoho CRM", type: "zapier" },
  { name: "Pipedrive", type: "zapier" },
  { name: "Freshsales", type: "zapier" },
  { name: "Monday CRM", type: "zapier" },
  { name: "Copper CRM", type: "zapier" },
  { name: "Insightly", type: "zapier" },
  { name: "Nimble", type: "zapier" },
  { name: "Keap (Infusionsoft)", type: "zapier" },
  { name: "ActiveCampaign", type: "zapier" },
  { name: "Zendesk Sell", type: "zapier" },
  { name: "Nutshell", type: "zapier" },
  { name: "Agile CRM", type: "zapier" },
  { name: "Capsule CRM", type: "zapier" },
  { name: "Less Annoying CRM", type: "zapier" },
  { name: "Bitrix24", type: "zapier" },
  { name: "SugarCRM", type: "zapier" },
  { name: "Microsoft Dynamics 365", type: "zapier" },
  // PSAs & ERPs with Zapier
  { name: "ConnectWise Manage", type: "zapier" },
  { name: "Syncro MSP", type: "zapier" },
  { name: "HaloPSA", type: "zapier" },
  { name: "Autotask (Datto/Kaseya)", type: "zapier" },
  { name: "Freshservice", type: "zapier" },
  { name: "Atera", type: "zapier" },
  { name: "NinjaOne (NinjaRMM)", type: "zapier" },
  { name: "RepairShopr", type: "zapier" },
  { name: "Pulseway", type: "zapier" },
  // Field Service
  { name: "ServiceTitan", type: "zapier" },
  { name: "Housecall Pro", type: "zapier" },
  { name: "Jobber", type: "zapier" },
  { name: "Simpro", type: "zapier" },
  { name: "MaintainX", type: "zapier" },
  { name: "Fleetio", type: "zapier" },
  { name: "Zuper", type: "zapier" },
  // Scheduling & Calendar
  { name: "Google Calendar", type: "zapier" },
  { name: "Microsoft Outlook", type: "zapier" },
  { name: "Calendly", type: "zapier" },
  { name: "Acuity Scheduling", type: "zapier" },
  { name: "YouCanBook.me", type: "zapier" },
  { name: "OnceHub (ScheduleOnce)", type: "zapier" },
  { name: "SimplyBook.me", type: "zapier" },
  { name: "Cal.com", type: "zapier" },
  { name: "Doodle", type: "zapier" },
  { name: "Appointy", type: "zapier" },
  { name: "Teamup", type: "zapier" },
  { name: "Vocus.io", type: "zapier" },
  // Communication
  { name: "Slack", type: "zapier" },
  { name: "Twilio", type: "zapier" },
  { name: "Gmail", type: "zapier" },
  { name: "Office 365 Email", type: "zapier" },
  { name: "Microsoft Teams", type: "zapier" },
  { name: "Discord", type: "zapier" },
  { name: "Intercom", type: "zapier" },
  { name: "Zendesk", type: "zapier" },
  { name: "Front", type: "zapier" },
  { name: "WhatsApp Business", type: "zapier" },
  { name: "MessageBird", type: "zapier" },
  // E-Commerce
  { name: "Shopify", type: "zapier" },
  { name: "WooCommerce", type: "zapier" },
  { name: "Magento", type: "zapier" },
  { name: "BigCommerce", type: "zapier" },
  { name: "Square", type: "zapier" },
  { name: "Stripe", type: "zapier" },
  // Documents & Forms
  { name: "PandaDoc", type: "zapier" },
  { name: "DocuSign", type: "zapier" },
  { name: "Adobe Acrobat Sign", type: "zapier" },
  { name: "Formstack Documents", type: "zapier" },
  { name: "PDF.co", type: "zapier" },
  { name: "Docparser", type: "zapier" },
  { name: "CloudConvert", type: "zapier" },
  { name: "Paperform", type: "zapier" },
  { name: "PDFfiller", type: "zapier" },
  { name: "Plumsail Documents", type: "zapier" },
  // Project Management
  { name: "Asana", type: "zapier" },
  { name: "Trello", type: "zapier" },
  { name: "Monday.com", type: "zapier" },
  { name: "ClickUp", type: "zapier" },
  { name: "Jira", type: "zapier" },
  { name: "Notion", type: "zapier" },
  { name: "Basecamp", type: "zapier" },
  { name: "Wrike", type: "zapier" },
  // Accounting & Finance
  { name: "QuickBooks Online", type: "zapier" },
  { name: "Xero", type: "zapier" },
  { name: "FreshBooks", type: "zapier" },
  { name: "Wave", type: "zapier" },
  { name: "Harvest", type: "zapier" },
  // Marketing
  { name: "Mailchimp", type: "zapier" },
  { name: "Constant Contact", type: "zapier" },
  { name: "Brevo (Sendinblue)", type: "zapier" },
  { name: "ConvertKit", type: "zapier" },
  { name: "Drip", type: "zapier" },
  { name: "Marketo", type: "zapier" },
  // Cloud Storage
  { name: "Google Drive", type: "zapier" },
  { name: "Dropbox", type: "zapier" },
  { name: "OneDrive", type: "zapier" },
  { name: "Box", type: "zapier" },
  // Social Media
  { name: "Facebook Pages", type: "zapier" },
  { name: "Instagram", type: "zapier" },
  { name: "LinkedIn", type: "zapier" },
  { name: "Twitter / X", type: "zapier" },
  { name: "YouTube", type: "zapier" },
  // Support & Helpdesk
  { name: "Freshdesk", type: "zapier" },
  { name: "Help Scout", type: "zapier" },
  { name: "Crisp", type: "zapier" },
  { name: "LiveChat", type: "zapier" },
  { name: "Drift", type: "zapier" },
  // HR & People
  { name: "BambooHR", type: "zapier" },
  { name: "Gusto", type: "zapier" },
  { name: "Rippling", type: "zapier" },
  // Forms & Surveys
  { name: "Typeform", type: "zapier" },
  { name: "Google Forms", type: "zapier" },
  { name: "JotForm", type: "zapier" },
  { name: "SurveyMonkey", type: "zapier" },
  { name: "Tally", type: "zapier" },
  // Misc Popular
  { name: "Airtable", type: "zapier" },
  { name: "Google Sheets", type: "zapier" },
  { name: "Zapier", type: "zapier" },
  { name: "Make (Integromat)", type: "zapier" },
  { name: "Webflow", type: "zapier" },
  { name: "WordPress", type: "zapier" },
  { name: "Twitch", type: "zapier" },
  { name: "Telegram", type: "zapier" },
  { name: "GitHub", type: "zapier" },
  { name: "GitLab", type: "zapier" },
  { name: "AWS Lambda", type: "zapier" },
  { name: "Firebase", type: "zapier" },
  { name: "Samsara", type: "zapier" },
  { name: "Route4Me", type: "zapier" },
  { name: "Bringg", type: "zapier" },
  { name: "ServiceNow", type: "zapier" },
  { name: "Docurama", type: "zapier" },

  // === WEBHOOK POSSIBLE (Yellow) — Niche/print-specific with webhook or API capability ===
  { name: "ECI e-automate", type: "webhook" },
  { name: "SalesChain", type: "webhook" },
  { name: "PrintFleet", type: "webhook" },
  { name: "FMAudit", type: "webhook" },
  { name: "Print Tracker", type: "webhook" },
  { name: "Tigerpaw", type: "webhook" },
  { name: "PaperCut MF", type: "webhook" },
  { name: "ezeep Blue", type: "webhook" },
  { name: "Print Autopilot", type: "webhook" },
  { name: "Cloudprinter.com", type: "webhook" },
  { name: "MFR Field Service Management", type: "webhook" },
  { name: "Kaseya VSA", type: "webhook" },

  // === CONTACT PHAOS (Red) — Legacy/proprietary with no known Zapier or webhook ===
  { name: "SAP ERP (On-Premise)", type: "contact" },
  { name: "Oracle E-Business Suite", type: "contact" },
  { name: "AS/400 Legacy Systems", type: "contact" },
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

  const renderBadge = (type: IntegrationType) => {
    switch (type) {
      case "zapier":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <Check className="w-3 h-3" />
            Full Integration
          </span>
        );
      case "webhook":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 whitespace-nowrap">
            <Webhook className="w-3 h-3" />
            Webhook Possible
          </span>
        );
      case "contact":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 whitespace-nowrap">
            <AlertCircle className="w-3 h-3" />
            Contact Phaos For More Info
          </span>
        );
    }
  };

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
                      {renderBadge(item.type)}
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
