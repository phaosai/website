import { motion } from "framer-motion";
import {
  Zap,
  ArrowRight,
  MessageSquare,
  Headphones,
  Mic,
  BrainCircuit,
  Workflow,
  CheckCircle,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import phaosHero from "@/assets/phaos-hero.png";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ROICalculator from "@/components/ROICalculator";
import WorkflowTeardownPopup from "@/components/WorkflowTeardownPopup";
import { organizationSchema, softwareApplicationSchema, homeFaqSchema } from "@/lib/seo-schemas";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const StyleTile = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Phaos AI — AI-Powered Voice & Workflow Automation"
        description="Deploy intelligent AI agents to manage inbound calls and automate complex workflows. Phaos AI eliminates manual operations with seamless, human-free automation."
        canonical="/"
        jsonLd={[organizationSchema, softwareApplicationSchema, homeFaqSchema]}
      />
      <Navigation />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${phaosHero})` }}
        />
        <div className="absolute inset-0 bg-background/85" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[180px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-light/6 blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full pt-24">
          <div className="max-w-2xl">
            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6"
            >
              <span className="text-gradient-purple">AI-Powered</span> Voice &
              <br />
              Agentic Workflow
              <br />
              Automation
            </motion.h1>

            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed"
            >
              Deploy intelligent AI agents to manage your inbound call volume while utilizing agentic workflows to eliminate your operation's manual grind. We replace multi-step, paper-heavy processes and excessive touchpoints with streamlined, human-free automation.
            </motion.p>

            <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link to="/contact" className="bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 transition-all text-base flex items-center gap-2 group">
                Schedule a Call
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/about" className="border border-border text-foreground font-medium px-8 py-3.5 rounded-full hover:bg-secondary transition-colors text-base">
                Learn More
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Investment / Partnership ── */}
      <section className="py-24 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Seeking <span className="text-gradient-purple">Strategic Partners</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
              Phaos AI is actively seeking strategic partners and investors who share our vision of transforming enterprise operations through AI. We're building the infrastructure that will power the next generation of customer engagement — and we're looking for the right partners to scale with us.
            </p>
            <Link to="/investors" className="inline-flex bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 transition-all text-base items-center gap-2 group">
              Get in Touch
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Two-Column Feature Cards ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Voice AI Meets <span className="text-gradient-purple">Agentic Automation</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Two powerful platforms. One seamless solution.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Voice AI Card */}
            <Link to="/voice-ai">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="rounded-3xl p-8 md:p-10 bg-gradient-to-br from-primary/20 via-card to-card border border-primary/20 group hover:border-primary/40 transition-colors cursor-pointer"
              >
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[Mic, Headphones, MessageSquare, Phone, BrainCircuit, Zap].map((Icon, i) => (
                    <div key={i} className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  ))}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">Voice AI Agents</h3>
                <p className="text-muted-foreground leading-relaxed">
                  AI voice agents that answer, qualify, and resolve customer calls instantly. No hold times, no scripts — just natural conversations that drive results around the clock.
                </p>
              </motion.div>
            </Link>

            {/* Agentic Workflows Card */}
            <Link to="/workflows">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="rounded-3xl p-8 md:p-10 bg-gradient-to-br from-purple-deep/20 via-card to-card border border-purple-deep/20 group hover:border-purple-deep/40 transition-colors cursor-pointer"
              >
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[Workflow, Zap, BrainCircuit, MessageSquare, CheckCircle, Phone].map((Icon, i) => (
                    <div key={i} className="w-14 h-14 rounded-2xl bg-purple-deep/10 flex items-center justify-center group-hover:bg-purple-deep/15 transition-colors">
                      <Icon className="w-6 h-6 text-purple-light" />
                    </div>
                  ))}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">Agentic Workflows</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Eliminate manual data entry, paper forms, and repetitive tasks. Our agentic workflows connect your systems and execute end-to-end processes autonomously.
                </p>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ Section for SEO ── */}
      <section className="py-24 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked <span className="text-gradient-purple">Questions</span>
            </h2>
          </motion.div>
          <div className="space-y-4">
            {[
              { q: "What is Phaos AI?", a: "Phaos AI is an AI-powered platform that deploys intelligent voice agents to manage inbound calls and agentic workflows to automate complex business operations — eliminating manual processes with seamless automation." },
              { q: "How does the Voice AI Agent work?", a: "Our voice agents answer calls 24/7 with hyper-realistic, emotionally intelligent conversations. They qualify leads, book appointments, handle FAQs, and seamlessly hand off to human agents when needed." },
              { q: "What industries does Phaos AI serve?", a: "While we have deep expertise in printing and document solutions, our platform serves any business that needs voice AI and workflow automation — healthcare, real estate, financial services, and more." },
              { q: "How much can I save?", a: "A copier dealership with 5 service calls/day can save over $100,000 annually. Use our free ROI Calculator to estimate your specific savings." },
              { q: "Does it integrate with my existing tools?", a: "Yes — Phaos AI offers native Zapier integrations with 6,000+ apps, webhook connectivity, and direct integrations with popular CRMs, ERPs, and industry software." },
            ].map(({ q, a }, i) => (
              <motion.details
                key={q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-card border border-border/50 p-5 group open:border-primary/30"
              >
                <summary className="text-foreground font-semibold cursor-pointer list-none flex items-center justify-between">
                  {q}
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI Calculator Embed ── */}
      <section className="py-24 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Free <span className="text-gradient-purple">System Audit Tool</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See how much you could save with AI-powered voice agents and workflow automation.
            </p>
          </motion.div>
          <ROICalculator embedded />
        </div>
      </section>

      <Footer />
      <WorkflowTeardownPopup />
    </div>
  );
};

export default StyleTile;
