import { motion } from "framer-motion";
import { ArrowRight, Workflow, Zap, BrainCircuit, FileText, Server, CreditCard, ShoppingCart, CheckCircle, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import WorkflowDiagram from "@/components/WorkflowDiagram";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const features = [
  { icon: FileText, title: "Document & Form Automation", description: "Eliminate paper-heavy bottlenecks. AI reads scanned documents, extracts data like serial numbers and order details, and pushes it directly into your ERP or CRM." },
  { icon: Server, title: "Cross-System Data Sync", description: "Automatically sync records between CRM, ERP, e-commerce, and service platforms — no manual data entry, no copy-paste errors." },
  { icon: Zap, title: "Event-Driven Triggers", description: "Workflows fire automatically when events happen — a new order, a printer error, a missed appointment, an invoice overdue — eliminating human bottlenecks." },
  { icon: CreditCard, title: "Payment & Billing Automation", description: "Automate invoice generation, payment reconciliation, subscription management, and collections — reducing AR cycles and improving cash flow." },
  { icon: ShoppingCart, title: "Inventory & Supply Chain", description: "Automatically reorder consumables based on real-time inventory levels, predict supply chain disruptions, and suggest alternatives to customers." },
  { icon: BrainCircuit, title: "Low-Code/No-Code Builder", description: "Non-technical managers can design and customize workflow logic through a visual interface — no developers required." },
  { icon: BarChart3, title: "Dynamic Pricing & Quoting", description: "Generate dynamic quotes by integrating real-time material costs, production schedules, and customer-specific discounts from your CRM." },
  { icon: Workflow, title: "Multi-Step Process Orchestration", description: "Chain complex, multi-step processes across platforms — from customer inquiry to fulfillment to follow-up — all automated end-to-end." },
];

const examples = [
  { industry: "Printing & Copier Dealers", example: "A printer reports an error via SNMP → workflow creates a service ticket in ConnectWise → dispatches the closest technician via Route4Me → sends the customer a confirmation SMS." },
  { industry: "Document Solutions", example: "A scanned service contract arrives via email → PDF.co extracts the serial number and terms → workflow updates the asset record in e-automate and schedules the renewal call." },
  { industry: "E-Commerce Operations", example: "A customer places an order on Shopify → inventory is checked → if stock is low, a reorder is triggered to the supplier → customer receives real-time shipping updates." },
  { industry: "Professional Services", example: "A new client signs a contract → workflow creates the project in your PM tool → sends onboarding emails → schedules the kickoff call → assigns team members." },
  { industry: "Field Service Companies", example: "A customer reports an issue → AI creates the work order → assigns the closest available technician → optimizes the route → sends the customer an ETA." },
];

const Workflows = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Agentic Workflows | Phaos AI"
        description="Eliminate manual data entry, paper forms, and repetitive tasks with AI-powered agentic workflows that connect your systems and execute processes autonomously."
        canonical="/workflows"
      />
      <Navigation />

      <section className="relative pt-32 pb-20 px-6 overflow-hidden" aria-label="Workflows Hero">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-deep/8 blur-[180px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-purple-deep/10 border border-purple-deep/20 rounded-full px-4 py-1.5 mb-6">
              <Workflow className="w-4 h-4 text-purple-light" aria-hidden="true" />
              <span className="text-sm text-purple-light font-medium">Agentic Workflows</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
              Automate the <br />
              <span className="text-gradient-purple shimmer-light">Manual Grind</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Eliminate multi-step, paper-heavy processes and excessive touchpoints. Phaos agentic workflows connect your systems and execute complex business processes autonomously — from document processing and inventory management to billing automation and cross-platform data sync.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Animated Workflow Diagram ── */}
      <section className="py-12 px-6" aria-label="How Workflow Automation Works">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <WorkflowDiagram />
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/30" aria-label="Workflow Capabilities">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Workflow <span className="text-gradient-purple">Capabilities</span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div key={feature.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl p-6 bg-card border border-border/50 hover:border-purple-deep/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-purple-deep/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-purple-light" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/30" aria-label="Workflow Examples">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Workflows <span className="text-gradient-purple">in Action</span>
            </h2>
            <div className="space-y-6">
              {examples.map((ex, i) => (
                <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl p-6 bg-card border border-border/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <p className="text-sm font-semibold text-primary mb-2">{ex.industry}</p>
                  <p className="text-muted-foreground leading-relaxed">{ex.example}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/30" aria-label="Call to Action">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to <span className="text-gradient-purple">Eliminate the Grind</span>?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Let us show you how agentic workflows can transform your operations.
            </p>
            <Link to="/contact" className="inline-flex bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 active:scale-[0.97] transition-all text-base items-center gap-2 group">
              Schedule a Call <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Workflows;
