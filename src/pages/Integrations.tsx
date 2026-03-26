import { motion } from "framer-motion";
import {
  ArrowRight,
  Phone,
  Workflow,
  ShoppingCart,
  Calendar,
  Users,
  CreditCard,
  Mail,
  Shield,
  FileText,
  Headphones,
  Server,
  Plug,
  Printer,
  MapPin,
  MessageSquare,
  Route,
  Wrench,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

interface Integration {
  name: string;
  description: string;
  icon: React.ElementType;
}

const mpsIntegrations: Integration[] = [
  { name: "PaperCut MF", description: "Export usage logs and track printer health, toner levels, and user print behavior in real-time", icon: Printer },
  { name: "ezeep Blue", description: "Natively integrated — trigger workflows on new print jobs and log them automatically for billing", icon: Printer },
  { name: "Cloudprinter.com", description: "Trigger AI voice agent calls to customers with delivery updates on order status changes", icon: Printer },
  { name: "Print Autopilot", description: "Automate document workflows and streamline print production processes end-to-end", icon: Printer },
  { name: "SNMP Monitoring (Syncro/MSP)", description: "Trigger service workflows when printers report error codes like paper jams or fuser errors", icon: Wrench },
];

const erpIntegrations: Integration[] = [
  { name: "ConnectWise Manage", description: "Create tickets, update project statuses, and log ticket notes automatically from AI interactions", icon: Headphones },
  { name: "Syncro MSP", description: "Trigger service appointments from RMM alerts and sync printer monitoring data seamlessly", icon: Server },
  { name: "Tigerpaw", description: "Sync customer contacts and service assets via REST API and webhook integrations", icon: Server },
  { name: "e-automate (ECI)", description: "Pull meter reads into Phaos for automated billing workflows via SQL-to-Web connections", icon: Server },
];

const crmIntegrations: Integration[] = [
  { name: "Salesforce", description: "AI qualifies leads and creates new contacts and opportunities automatically in your CRM", icon: Users },
  { name: "HubSpot", description: "Auto-log call transcripts, update deal stages, and trigger marketing sequences from conversations", icon: Users },
];

const ecommerceIntegrations: Integration[] = [
  { name: "Shopify", description: "AI checks fulfillment status when customers ask about orders — real-time lookups during calls", icon: ShoppingCart },
  { name: "WooCommerce", description: "Manage online supply catalogs and trigger AI updates on order events and inventory changes", icon: ShoppingCart },
  { name: "Magento", description: "Sync enterprise-level catalog data for automated reordering and product availability updates", icon: ShoppingCart },
];

const documentIntegrations: Integration[] = [
  { name: "PDF.co", description: "AI-powered document processor that reads scanned PDFs, extracts data like serial numbers, and sends it to your ERP", icon: FileText },
];

const fieldServiceIntegrations: Integration[] = [
  { name: "WorkWave / ServiceTitan", description: "Send dispatch info from AI calls directly to a technician's mobile app via webhooks", icon: MapPin },
  { name: "Google Maps / Route4Me", description: "Automatically calculate the best route for technicians based on AI-created service tickets", icon: Route },
];

const calendarIntegrations: Integration[] = [
  { name: "Google Calendar", description: "AI finds open slots and books appointments during live customer conversations automatically", icon: Calendar },
  { name: "Microsoft Outlook / Office 365", description: "Enterprise scheduling, calendar sync, and email routing for automated follow-ups", icon: Calendar },
];

const communicationIntegrations: Integration[] = [
  { name: "Slack", description: "AI drops summaries of high-priority service calls into team channels for instant awareness", icon: MessageSquare },
  { name: "Twilio", description: "Send automated SMS to customers — appointment confirmations, technician ETAs, and status updates", icon: Phone },
  { name: "Gmail / Office 365 Email", description: "Send structured, automated follow-up emails post-call with full conversation context", icon: Mail },
  { name: "Don't See Your Application?", description: "Ask us if we can quickly and easily connect to your specific systems! If there are Zapier Triggers or webhooks, we can make it happen quick and painless.", icon: Plug },
];

const categories = [
  { title: "Managed Print Services & Print Management", integrations: mpsIntegrations, icon: Printer },
  { title: "Industry-Specific ERPs & PSAs", integrations: erpIntegrations, icon: Server },
  { title: "CRM & Sales", integrations: crmIntegrations, icon: Users },
  { title: "E-Commerce & Inventory", integrations: ecommerceIntegrations, icon: ShoppingCart },
  { title: "Document & Form Automation", integrations: documentIntegrations, icon: FileText },
  { title: "Field Service & Logistics", integrations: fieldServiceIntegrations, icon: MapPin },
  { title: "Scheduling & Calendar", integrations: calendarIntegrations, icon: Calendar },
  { title: "Multi-Channel Communication", integrations: communicationIntegrations, icon: MessageSquare },
];

const IntegrationCard = ({ integration, index }: { integration: Integration; index: number }) => (
  <motion.div
    custom={index}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={fadeUp}
    className="rounded-2xl p-6 bg-card border border-border/50 hover:border-primary/30 transition-all group"
  >
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
      <integration.icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{integration.name}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{integration.description}</p>
  </motion.div>
);

const Integrations = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navigation />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-light/4 blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Plug className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Planned Integrations</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
              Connect to the Tools <br />
              <span className="text-gradient-purple">Your Business Runs On</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Phaos AI agents and workflows integrate with the platforms you already use — giving your AI access to real-time data from CRMs, ERPs, print management systems, e-commerce platforms, and more. No silos. No manual handoffs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How <span className="text-gradient-purple">Integrations</span> Work
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Both platforms connect seamlessly to your existing tech stack.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="rounded-3xl p-8 bg-gradient-to-br from-primary/15 via-card to-card border border-primary/20">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
                <Phone className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Voice AI + Integrations</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                During live calls, your AI agent pulls customer data, order history, and account details from connected systems — answering questions, booking appointments, and updating records in real-time.
              </p>
              <ul className="space-y-3">
                {[
                  "Access CRM records during live conversations",
                  "Book appointments directly into calendars",
                  "Pull real-time order status from e-commerce platforms",
                  "Create service tickets and dispatch technicians",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.15 }} className="rounded-3xl p-8 bg-gradient-to-br from-purple-deep/15 via-card to-card border border-purple-deep/20">
              <div className="w-14 h-14 rounded-2xl bg-purple-deep/15 flex items-center justify-center mb-6">
                <Workflow className="w-7 h-7 text-purple-light" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Workflows + Integrations</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Agentic workflows read from and write to your connected platforms — automating data entry, syncing records across systems, triggering actions, and eliminating the manual touchpoints that slow your operations down.
              </p>
              <ul className="space-y-3">
                {[
                  "Sync data across CRM, ERP, and e-commerce systems",
                  "Auto-create service tickets from printer error alerts",
                  "Route technicians and optimize dispatch schedules",
                  "Send automated SMS and email follow-ups",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="w-4 h-4 text-purple-light mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Autonomous Workflow Example */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
              An <span className="text-gradient-purple">Autonomous Scenario</span>
            </h2>
            <p className="text-muted-foreground text-lg text-center mb-10 max-w-2xl mx-auto">
              See how Phaos AI connects disparate systems into a single, automated workflow.
            </p>
            <div className="space-y-4">
              {[
                { step: "1", text: "A customer calls the Phaos AI Voice Agent to report a broken copier." },
                { step: "2", text: "The AI cross-references the caller's phone number with your CRM to find the active contract." },
                { step: "3", text: "An emergency service ticket is automatically created in ConnectWise." },
                { step: "4", text: "The closest technician is scheduled using Google Calendar and Route4Me." },
                { step: "5", text: "A confirmation text is sent to the customer via Twilio." },
                { step: "6", text: "The internal team is alerted via Slack with a full summary." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="flex items-start gap-4 rounded-2xl p-5 bg-card border border-border/50"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{item.step}</span>
                  </div>
                  <p className="text-foreground leading-relaxed">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Integration Categories */}
      {categories.map((category, catIdx) => (
        <section key={category.title} className="py-16 px-6 border-t border-border/30">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="mb-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">{category.title}</h2>
              </div>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {category.integrations.map((integration, i) => (
                <IntegrationCard key={integration.name} integration={integration} index={i + catIdx} />
              ))}
            </div>
          </div>
        </section>
      ))}


      {/* CTA */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to <span className="text-gradient-purple">Connect Your Stack</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Let us show you how Phaos AI integrates with the tools you already use — and how it can eliminate the manual work between them.
            </p>
            <a href="/contact" className="inline-flex bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 transition-all text-base items-center gap-2 group">
              Schedule a Call
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Integrations;
