import { motion } from "framer-motion";
import { Bot, Phone, Zap, Shield, ArrowRight, Mail, MapPin } from "lucide-react";
import phaosHero from "@/assets/phaos-hero.png";
import phaosLogo from "@/assets/phaos-logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const StyleTile = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* ── Nav Preview ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 glass-strong"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={phaosLogo} alt="Phaos AI" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-lg font-bold tracking-tight">Phaos AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <span className="hover:text-foreground transition-colors cursor-pointer">Product</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">About</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Contact</span>
          </div>
          <button className="bg-gradient-purple text-primary-foreground text-sm font-medium px-5 py-2 rounded-lg glow-purple hover:opacity-90 transition-opacity">
            Book a Demo
          </button>
        </div>
      </motion.nav>

      {/* ── Hero Mockup ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-light/8 blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 mb-8">
              Enterprise AI Platform
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6"
          >
            <span className="text-gradient-purple">AI-Powered</span> Voice &{" "}
            <br className="hidden md:block" />
            Agentic Workflow Automation
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Deploy intelligent voice agents and workflow automation that transform
            how enterprises operate — from first contact to final resolution.
          </motion.p>

          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp} className="flex items-center justify-center gap-4">
            <button className="bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-xl glow-purple-lg hover:opacity-90 transition-all text-base flex items-center gap-2 group">
              Book a Demo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="border border-border text-foreground font-medium px-8 py-3.5 rounded-xl hover:bg-secondary transition-colors text-base">
              Learn More
            </button>
          </motion.div>
        </div>

        {/* Hero image preview */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-4xl mx-auto mt-16 relative"
        >
          <div className="rounded-2xl overflow-hidden border border-border/50 glow-purple">
            <img src={phaosHero} alt="Phaos AI Platform" className="w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent rounded-2xl" />
          </div>
        </motion.div>
      </section>

      {/* ── Style Tile: Color Palette ── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-8"
          >
            Color Palette
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: "Background", color: "bg-background", hex: "#0a0a1a" },
              { name: "Card", color: "bg-card", hex: "#141422" },
              { name: "Primary", color: "bg-primary", hex: "#7c3aed" },
              { name: "Purple Light", color: "bg-purple-light", hex: "#a855f7" },
              { name: "Purple Deep", color: "bg-purple-deep", hex: "#5b21b6" },
            ].map((c, i) => (
              <motion.div
                key={c.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className={`${c.color} h-24 rounded-xl border border-border/30`} />
                <p className="text-sm font-medium mt-2">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.hex}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Style Tile: Typography ── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-8">
            Typography — Inter
          </h2>
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-xs text-muted-foreground mb-1">Display / 72px / Extrabold</p>
              <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-gradient-purple">
                Phaos AI
              </h1>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <p className="text-xs text-muted-foreground mb-1">Headline / 40px / Bold</p>
              <h2 className="text-4xl font-bold">Intelligent Automation at Scale</h2>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <p className="text-xs text-muted-foreground mb-1">Body / 18px / Regular</p>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Deploy enterprise-grade AI voice agents that handle thousands of conversations simultaneously,
                integrated with your existing CRM and workflow tools.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <p className="text-xs text-muted-foreground mb-1">Caption / 12px / Medium / Uppercase</p>
              <p className="text-xs font-medium tracking-widest uppercase text-primary">Enterprise AI Platform</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Style Tile: Buttons ── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-8">
            Button Styles
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-xl glow-purple-lg text-base flex items-center gap-2"
            >
              Primary CTA <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="border border-border text-foreground font-medium px-8 py-3.5 rounded-xl hover:bg-secondary transition-colors text-base"
            >
              Secondary
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="text-primary font-medium px-6 py-3.5 text-base hover:underline underline-offset-4"
            >
              Text Link →
            </motion.button>
          </div>
        </div>
      </section>

      {/* ── Style Tile: Feature Cards ── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-8">
            Feature Card Components
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Phone, title: "Voice AI Agents", desc: "Human-like conversations powered by advanced LLMs, handling inbound and outbound calls 24/7." },
              { icon: Zap, title: "Agentic Workflows", desc: "AI that doesn't just talk — it takes action across your CRM, calendar, and business tools." },
              { icon: Shield, title: "Enterprise Security", desc: "SOC 2 compliant infrastructure with end-to-end encryption and role-based access controls." },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="glass rounded-2xl p-8 group cursor-pointer hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:glow-purple transition-all">
                  <card.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{card.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mini Footer Preview ── */}
      <section className="px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-8">
            Footer Preview
          </h2>
          <div className="glass rounded-2xl p-8">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img src={phaosLogo} alt="Phaos AI" className="h-8 w-8 rounded-lg object-cover" />
                  <span className="text-lg font-bold">Phaos AI</span>
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  AI-Powered Voice & Agentic Workflow Automation for the modern enterprise.
                </p>
              </div>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>Info@PhaosAI.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>(617) 678-2426</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Casselberry, Florida USA</span>
                </div>
              </div>
            </div>
            <div className="border-t border-border/50 mt-8 pt-6 text-center text-xs text-muted-foreground">
              © 2026 Phaos AI. All rights reserved.
            </div>
          </div>
        </div>
      </section>

      <div className="h-16" />
    </div>
  );
};

export default StyleTile;
