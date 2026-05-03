import { motion } from "framer-motion";
import { ArrowRight, Workflow, Zap, BrainCircuit, FileText, Server, CreditCard, ShoppingCart, CheckCircle, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { workflowPageSchema } from "@/lib/seo-schemas";
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
        jsonLd={workflowPageSchema}
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
              <span className="text-gradient-purple">Manual Grind</span>
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

      {/* ── Phaos Kyrios: Governance Layer ── */}
      <section className="py-20 px-6 border-t border-border/30" aria-label="Phaos Kyrios Governance">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-3xl mb-14">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Phaos Kyrios</span>
              <FeatureStatusBadge status="ROADMAP" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-5">
              The <span className="text-gradient-purple">Governance Layer</span> Between Signal and Action
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Phaos Kyrios governs the operational layer between research signals and structured action — with approval stages, review states, and complete audit trails at every step.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {[
              {
                tag: "Use Case 01",
                title: "Research to Action",
                steps: [
                  "Sunesis surfaces a PCI 88 signal",
                  "Kyrios creates a review item",
                  "Reviewer evaluates evidence",
                  "Human approves or rejects",
                  "Decision logged permanently in Aion audit trail",
                ],
              },
              {
                tag: "Use Case 02",
                title: "Client Research Publishing",
                steps: [
                  "Analyst generates Truth Memo in Sunesis",
                  "Kyrios routes to senior reviewer",
                  "Compliance check against disclosure checklist",
                  "Approved for client portal publication",
                  "Client receives curated research brief",
                ],
              },
              {
                tag: "Use Case 03",
                title: "Alert-to-Review",
                steps: [
                  "Aion detects material change in monitored ticker",
                  "Kyrios creates priority review task",
                  "Notification sent to assigned reviewer",
                  "Resolution documented and archived",
                ],
              },
            ].map((uc, i) => (
              <motion.div
                key={uc.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl p-6 bg-card border border-border/50 hover:border-purple-deep/30 transition-all duration-300 flex flex-col"
              >
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-purple-light mb-2">{uc.tag}</p>
                <h3 className="text-lg font-semibold text-foreground mb-5">{uc.title}</h3>
                <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  {uc.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-purple-deep/15 border border-purple-deep/30 text-[10px] font-semibold text-purple-light flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl border border-purple-deep/30 bg-purple-deep/5 p-8 md:p-10 text-center"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-purple-light mb-3">Core Principle</p>
            <p className="text-xl md:text-2xl font-semibold text-foreground leading-snug max-w-3xl mx-auto">
              "No consequential action happens without human confirmation. Phaos Kyrios is the stewardship layer — not an autonomous execution bot."
            </p>
          </motion.div>

          <p className="text-xs text-muted-foreground/80 leading-relaxed text-center mt-8 max-w-2xl mx-auto">
            Phaos AI workflow tools are for research organization and governance. They do not execute trades or provide financial advice.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link
              to="/one/kyrios"
              className="inline-flex bg-gradient-purple text-primary-foreground font-semibold px-7 py-3 rounded-full glow-purple hover:opacity-90 active:scale-[0.97] transition-all text-sm items-center gap-2 group"
              data-interactive
            >
              Explore Phaos Kyrios <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/one"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground border border-border/60 hover:border-purple-deep/40 px-6 py-3 rounded-full transition-all"
              data-interactive
            >
              See Phaos ONE
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/30" aria-label="Call to Action">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to <span className="text-gradient-purple">Eliminate the Grind</span>?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Let us show you how agentic workflows can transform your operations.
            </p>
            <Link to="/contact" className="inline-flex bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 active:scale-[0.97] transition-all text-base items-center gap-2 group" data-interactive>
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
