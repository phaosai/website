import { motion } from "framer-motion";
import { ArrowRight, FileText, TrendingUp, Shield, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const phases = [
  {
    phase: "Phase 1: Genesis",
    status: "Active",
    description: "Foundational intelligence & MVP — Intelligent print industry inquiries, scheduling, 24/7 call handling, CRM integration.",
    highlights: ["24/7 AI Phone Answering", "Lead Qualification & Booking", "E-commerce Integration", "Industry-Specific FAQ Handling"],
  },
  {
    phase: "Phase 2: Nephilim",
    status: "In Development",
    description: "Next-level intelligence — Outbound AI dialer, Uncanny Valley voice breakthrough, multilingual support, churn prevention.",
    highlights: ["Outbound AI Dialer", "Uncanny Valley Breakthrough", "Low-Code Flow Builder", "Predictive Analytics"],
  },
  {
    phase: "Phase 3: Ethereal",
    status: "Planned",
    description: "Dynamic operational intelligence — Generative AI conversations, financial handling, global verticalization.",
    highlights: ["PCI-DSS Payments", "Multi-Modal Fusion", "Hyper-Specialized Agents", "Federated Learning"],
  },
  {
    phase: "Phase 4: Transcendence",
    status: "R&D",
    description: "Quantum & autonomous intelligence — Quantum optimization, cognitive emulation, voice cloning.",
    highlights: ["Quantum Routing", "Digital Twin Problem-Solving", "Voice Cloning", "Omni-Sensory AI"],
  },
];

const InvestorRelations = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Investor Relations — Technical Deep Dive"
        description="Explore Phaos AI's product architecture, development roadmap, and investment thesis. Built for the future of AI voice and workflow automation."
        canonical="/investor-relations"
      />
      <Navigation />

      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Investor Relations</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight mb-4">
              Technical <span className="text-gradient-purple">Deep Dive</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Architecture overview, product roadmap, and investment thesis for Phaos AI's proprietary voice and workflow automation platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-16 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Platform <span className="text-gradient-purple">Architecture</span></h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Layers, title: "Dual-Platform", desc: "Voice AI Agents + Agentic Workflows — two products, one seamless solution addressing the full operational stack." },
              { icon: Shield, title: "Enterprise-Grade Security", desc: "SOC 2, GDPR, CCPA, HIPAA, PCI-DSS compliant. All data encrypted at rest and in transit with PII separation." },
              { icon: FileText, title: "Integration Ecosystem", desc: "Native Zapier integrations with 6,000+ apps, webhook connectivity, and direct CRM/ERP integrations." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="rounded-2xl p-6 bg-card border border-border/50"
              >
                <Icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Roadmap */}
      <section className="py-16 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">Product <span className="text-gradient-purple">Roadmap</span></h2>
          <div className="space-y-6">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl p-6 md:p-8 bg-card border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                  <h3 className="text-xl font-bold text-foreground">{phase.phase}</h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${
                    phase.status === "Active" ? "bg-green-500/15 text-green-400" :
                    phase.status === "In Development" ? "bg-primary/15 text-primary" :
                    phase.status === "Planned" ? "bg-yellow-500/15 text-yellow-400" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {phase.status}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">{phase.description}</p>
                <div className="flex flex-wrap gap-2">
                  {phase.highlights.map((h) => (
                    <span key={h} className="text-xs bg-secondary px-3 py-1.5 rounded-full text-muted-foreground">{h}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl font-bold mb-4">Interested in <span className="text-gradient-purple">Investing</span>?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              We're building the AI infrastructure that will power the next generation of customer engagement. Let's discuss how you can be part of it.
            </p>
            <Link to="/contact" className="inline-flex bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 transition-all items-center gap-2 group">
              Schedule a Call <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InvestorRelations;
