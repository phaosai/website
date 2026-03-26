import { motion } from "framer-motion";
import {
  ArrowRight,
  Phone,
  Workflow,
  Database,
  ShoppingCart,
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Mail,
  Globe,
  Shield,
  Cpu,
  FileText,
  Headphones,
  Server,
  Layers,
  Plug,
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
  category: "crm" | "ecommerce" | "calendar" | "erp" | "payments" | "analytics" | "cloud" | "communication";
}

const voiceIntegrations: Integration[] = [
  { name: "Salesforce", description: "Sync call data, lead qualification, and customer records in real-time", icon: Users, category: "crm" },
  { name: "HubSpot", description: "Auto-log calls, update contacts, and trigger workflows from conversations", icon: Users, category: "crm" },
  { name: "ConnectWise", description: "Create service tickets, update customer records, and manage dispatching", icon: Headphones, category: "crm" },
  { name: "Google Calendar", description: "Book appointments and schedule service calls during live conversations", icon: Calendar, category: "calendar" },
  { name: "Microsoft Outlook", description: "Calendar sync and email follow-ups triggered by call outcomes", icon: Mail, category: "calendar" },
  { name: "Shopify", description: "Access order status, product info, and customer purchase history", icon: ShoppingCart, category: "ecommerce" },
  { name: "WooCommerce", description: "Pull order tracking, inventory levels, and cart data into conversations", icon: ShoppingCart, category: "ecommerce" },
  { name: "Magento", description: "Provide real-time product availability and order updates to callers", icon: ShoppingCart, category: "ecommerce" },
  { name: "Stripe", description: "Process secure payments and verify transaction status during calls", icon: CreditCard, category: "payments" },
  { name: "QuickBooks", description: "Access invoice data, payment history, and account balances", icon: FileText, category: "erp" },
];

const workflowIntegrations: Integration[] = [
  { name: "Salesforce", description: "Automate lead routing, opportunity updates, and account management workflows", icon: Users, category: "crm" },
  { name: "HubSpot", description: "Trigger marketing sequences, update deal stages, and sync contact data", icon: Users, category: "crm" },
  { name: "SAP", description: "Connect to ERP modules for procurement, inventory, and financial workflows", icon: Server, category: "erp" },
  { name: "Oracle NetSuite", description: "Automate order-to-cash, procure-to-pay, and financial close processes", icon: Database, category: "erp" },
  { name: "Shopify", description: "Automate order fulfillment, inventory sync, and customer notification workflows", icon: ShoppingCart, category: "ecommerce" },
  { name: "WooCommerce", description: "Trigger automated workflows on order events, returns, and inventory changes", icon: ShoppingCart, category: "ecommerce" },
  { name: "Stripe", description: "Automate payment reconciliation, subscription management, and refund workflows", icon: CreditCard, category: "payments" },
  { name: "Google Workspace", description: "Automate document creation, email workflows, and calendar management", icon: Globe, category: "communication" },
  { name: "Microsoft 365", description: "Connect to Teams, SharePoint, and Outlook for cross-platform automation", icon: Layers, category: "communication" },
  { name: "Slack", description: "Send automated alerts, approvals, and workflow status updates to channels", icon: Mail, category: "communication" },
  { name: "AWS", description: "Leverage cloud infrastructure for scalable, secure workflow execution", icon: Cpu, category: "cloud" },
  { name: "Google Cloud", description: "AI/ML services, data processing, and serverless workflow orchestration", icon: Cpu, category: "cloud" },
  { name: "Microsoft Azure", description: "Enterprise-grade cloud services with Active Directory integration", icon: Cpu, category: "cloud" },
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Plug className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Planned Integrations</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
              Connect to the Tools <br />
              <span className="text-gradient-purple">Your Business Runs On</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Phaos AI agents and workflows integrate with the platforms you already use — giving your AI access to real-time data from CRMs, ERPs, e-commerce platforms, and more. No silos. No manual handoffs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How <span className="text-gradient-purple">Integrations</span> Work
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Both platforms connect seamlessly to your existing tech stack.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-3xl p-8 bg-gradient-to-br from-primary/15 via-card to-card border border-primary/20"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
                <Phone className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Voice AI + Integrations</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                During live calls, your AI agent pulls customer data, order history, and account details from connected systems — answering questions, booking appointments, and updating records in real-time without any human involvement.
              </p>
              <ul className="space-y-3">
                {[
                  "Access CRM records during live conversations",
                  "Book appointments directly into calendars",
                  "Pull real-time order status from e-commerce platforms",
                  "Process payments securely during calls",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="rounded-3xl p-8 bg-gradient-to-br from-purple-deep/15 via-card to-card border border-purple-deep/20"
            >
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
                  "Trigger automated actions on events across platforms",
                  "Auto-generate documents and send notifications",
                  "Reconcile payments and manage subscriptions",
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

      {/* Voice AI Integrations */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Voice AI Agent Integrations</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Your AI call agents will have direct access to data from these platforms — enabling real-time lookups, updates, and actions during live conversations.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {voiceIntegrations.map((integration, i) => (
              <IntegrationCard key={integration.name + "-voice"} integration={integration} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Integrations */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-deep/15 flex items-center justify-center">
                <Workflow className="w-5 h-5 text-purple-light" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Agentic Workflow Integrations</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Workflows will connect to these platforms to automate multi-step processes — reading, writing, and syncing data across your entire tech stack.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {workflowIntegrations.map((integration, i) => (
              <IntegrationCard key={integration.name + "-workflow"} integration={integration} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Security Strip */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Enterprise-Grade <span className="text-gradient-purple">Security</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              All integrations are built with end-to-end encryption, role-based access controls, and compliance with GDPR, CCPA, HIPAA, and PCI-DSS standards. Your data stays secure at every touchpoint.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {["End-to-End Encryption", "SOC 2 Compliant", "HIPAA Ready", "PCI-DSS Secure", "GDPR & CCPA"].map((badge) => (
                <span key={badge} className="bg-secondary text-sm text-muted-foreground px-4 py-2 rounded-full border border-border/50">
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to <span className="text-gradient-purple">Connect Your Stack</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Let us show you how Phaos AI integrates with the tools you already use — and how it can eliminate the manual work between them.
            </p>
            <button className="bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 transition-all text-base flex items-center gap-2 group mx-auto">
              Schedule a Call
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Integrations;
