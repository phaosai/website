import { motion } from "framer-motion";
import { ArrowRight, Target, Eye, Heart, Lightbulb, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import danielPhoto from "@/assets/daniel-lindros.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navigation />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
              About <span className="text-gradient-purple">Phaos AI</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We're building the AI infrastructure that transforms how businesses engage customers and run operations — starting with the industries that need it most.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="rounded-3xl p-8 bg-gradient-to-br from-primary/15 via-card to-card border border-primary/20">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
              <Eye className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Our Vision</h2>
            <p className="text-muted-foreground leading-relaxed">
              To empower businesses across industries with hyper-realistic, emotionally intelligent, and autonomously proactive AI — transforming customer engagement and operational efficiency from reactive support to predictive, personalized care.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.15 }} className="rounded-3xl p-8 bg-gradient-to-br from-purple-deep/15 via-card to-card border border-purple-deep/20">
            <div className="w-14 h-14 rounded-2xl bg-purple-deep/15 flex items-center justify-center mb-6">
              <Target className="w-7 h-7 text-purple-light" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              To develop and deploy cutting-edge conversational AI that sets new benchmarks for natural interaction, deep contextual understanding, and self-improving intelligence — enabling businesses to scale customer satisfaction, optimize resource allocation, and unlock unprecedented growth.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Core <span className="text-gradient-purple">Principles</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: "Human-Centric AI", description: "We design AI that enhances human capabilities and interactions — not replaces them entirely." },
              { icon: Shield, title: "Ethical & Transparent", description: "We build AI with inherent ethical guidelines, ensuring fairness, privacy, and explainability at every level." },
              { icon: Lightbulb, title: "Scalability & Adaptability", description: "A flexible architecture capable of rapid expansion into new verticals and evolving industry needs." },
              { icon: Target, title: "Continuous Learning", description: "A culture of iterative development and data-driven optimization — because growth is a journey of refinement." },
              { icon: Eye, title: "Customer ROI First", description: "Every feature must demonstrably contribute to customer ROI and market leadership." },
            ].map((principle, i) => (
              <motion.div
                key={principle.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl p-6 bg-card border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <principle.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{principle.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{principle.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What We're Building */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              What We're <span className="text-gradient-purple">Building</span>
            </h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed text-lg">
              <p>
                Phaos AI is developing a dual-platform solution: <strong className="text-foreground">Voice AI Agents</strong> that handle inbound and outbound calls with human-like intelligence, and <strong className="text-foreground">Agentic Workflows</strong> that automate complex, multi-step business processes end-to-end.
              </p>
              <p>
                We started by tackling the printing, copier, and document solutions industry — a sector drowning in manual processes, paper-heavy workflows, and excessive customer touchpoints. But our technology is built to serve any business that relies on high call volumes, repetitive operations, and disconnected systems.
              </p>
              <p>
                From automated service dispatching and intelligent call routing to proactive customer outreach and cross-platform data sync, Phaos AI replaces the manual grind with seamless, autonomous automation.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              Meet the <span className="text-gradient-purple">Founder</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl p-8 md:p-12 bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-48 h-48 rounded-2xl overflow-hidden shrink-0 border-2 border-primary/30">
                <img
                  src={danielPhoto}
                  alt="Daniel Lindros — Founder & CEO of Phaos AI"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">Daniel Lindros</h3>
                <p className="text-primary font-medium mb-4">Founder & CEO</p>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Daniel Lindros is a seasoned operations and sales executive with over 17 years of experience driving growth across SaaS, technology, and service-driven businesses. A relentless KPI optimizer and data-driven strategist, Daniel has spent his career building and scaling high-performance teams, refining go-to-market strategies, and turning operational inefficiencies into competitive advantages.
                  </p>
                  <p>
                    His deep understanding of B2B sales cycles, customer engagement, and operational workflows — combined with a passion for emerging technology — led him to found Phaos AI. Daniel saw firsthand how businesses in the printing and document solutions industry were buried under manual processes, excessive call volumes, and disconnected systems. He set out to build an AI platform that doesn't just automate — it transforms.
                  </p>
                  <p>
                    Based in Central Florida, Daniel brings a servant-leadership philosophy to every aspect of Phaos AI — building technology that empowers businesses and the people behind them.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to <span className="text-gradient-purple">Join the Journey</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Whether you're a potential partner, investor, or customer — we'd love to connect.
            </p>
            <Link to="/contact" className="inline-flex bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 transition-all text-base items-center gap-2 group">
              Schedule a Call
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
