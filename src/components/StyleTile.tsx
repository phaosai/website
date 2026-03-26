import { motion } from "framer-motion";
import {
  Bot,
  Phone,
  Zap,
  Shield,
  ArrowRight,
  Mail,
  MapPin,
  MessageSquare,
  Headphones,
  BarChart3,
  Settings,
  Users,
  Clock,
  CheckCircle,
  Mic,
  BrainCircuit,
  Workflow,
  Lock,
} from "lucide-react";
import phaosHero from "@/assets/phaos-hero.png";
import phaosLogo from "@/assets/phaos-logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const StyleTile = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* ── Navigation ── */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 glass-strong"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={phaosLogo} alt="Phaos AI" className="h-8 w-8 rounded-lg object-cover brightness-150" />
            <span className="text-lg font-bold tracking-tight text-foreground">Phaos AI</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-sm text-muted-foreground">
            <span className="hover:text-foreground transition-colors cursor-pointer">Product</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">About</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Contact</span>
          </div>
          <button className="bg-gradient-purple text-primary-foreground text-sm font-medium px-5 py-2 rounded-full glow-purple hover:opacity-90 transition-opacity">
            Book a Demo
          </button>
        </div>
      </motion.nav>

      {/* ── Hero — Full-bleed with background image ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${phaosHero})` }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-background/85" />
        {/* Glow orbs */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[180px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-light/6 blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full grid lg:grid-cols-2 gap-12 items-center pt-24">
          {/* Left — copy */}
          <div>
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
              Deploy intelligent voice agents and workflow automation that transform how enterprises operate — from first contact to final resolution.
            </motion.p>

            <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp} className="flex items-center gap-4">
              <button className="bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 transition-all text-base flex items-center gap-2 group">
                Book a Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="border border-border text-foreground font-medium px-8 py-3.5 rounded-full hover:bg-secondary transition-colors text-base">
                Learn More
              </button>
            </motion.div>
          </div>

          {/* Right — Chat bubble mockup */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="hidden lg:flex flex-col gap-4 items-end"
          >
            <div className="glass rounded-2xl p-5 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Phaos AI Agent</p>
                  <p className="text-xs text-muted-foreground">Active now</p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
              </div>
              <div className="space-y-3">
                <div className="bg-secondary rounded-2xl rounded-tl-md px-4 py-3">
                  <p className="text-sm text-foreground">Hi! I've reviewed your account and see you have a pending renewal. Want me to process that now?</p>
                </div>
                <div className="bg-primary/20 rounded-2xl rounded-tr-md px-4 py-3 ml-8">
                  <p className="text-sm text-foreground">Yes, please go ahead.</p>
                </div>
                <div className="bg-secondary rounded-2xl rounded-tl-md px-4 py-3">
                  <p className="text-sm text-foreground">Done! ✅ Renewal confirmed and receipt sent to your email. Anything else I can help with?</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Partner / Investment Strip ── */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm font-medium tracking-widest uppercase text-muted-foreground mb-12"
          >
            Seeking Strategic Partners & Investors
          </motion.p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {["Technology Partners", "Venture Capital", "Strategic Alliances", "Enterprise Clients"].map((label, i) => (
              <motion.div
                key={label}
                custom={i}
                variants={fadeUp}
                className="glass rounded-xl p-6 flex flex-col items-center justify-center text-center h-28 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-border mb-3 flex items-center justify-center">
                  <span className="text-muted-foreground text-lg">+</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
              </motion.div>
            ))}
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
              Transform Your <span className="text-gradient-purple">Customer Experience</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Enterprise-grade AI that doesn't just talk — it takes action.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Voice AI Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-3xl p-8 md:p-10 bg-gradient-to-br from-primary/20 via-card to-card border border-primary/20 group hover:border-primary/40 transition-colors"
            >
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[Mic, Headphones, MessageSquare, Phone, BrainCircuit, Bot].map((Icon, i) => (
                  <div key={i} className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                ))}
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Voice AI Agents</h3>
              <p className="text-muted-foreground leading-relaxed">
                Human-like conversations powered by advanced LLMs. Handle inbound and outbound calls 24/7 with natural language understanding that feels indistinguishable from a live agent.
              </p>
            </motion.div>

            {/* Agentic Workflows Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="rounded-3xl p-8 md:p-10 bg-gradient-to-br from-purple-deep/20 via-card to-card border border-purple-deep/20 group hover:border-purple-deep/40 transition-colors"
            >
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[Workflow, Zap, Settings, BarChart3, Users, CheckCircle].map((Icon, i) => (
                  <div key={i} className="w-14 h-14 rounded-2xl bg-purple-deep/10 flex items-center justify-center group-hover:bg-purple-deep/15 transition-colors">
                    <Icon className="w-6 h-6 text-purple-light" />
                  </div>
                ))}
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Agentic Workflows</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI that doesn't just talk — it takes action across your CRM, calendar, and business tools. Automate complex multi-step processes with intelligent decision-making.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats / Metrics ── */}
      <section className="py-24 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold">
              The Results Speak <span className="text-gradient-purple">for Themselves</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { value: "10M+", label: "Conversations Handled", icon: MessageSquare },
              { value: "<2s", label: "Average Response Time", icon: Clock },
              { value: "98.5%", label: "Resolution Accuracy", icon: CheckCircle },
              { value: "24/7", label: "Always Available", icon: Shield },
            ].map((stat, i) => (
              <motion.div key={stat.label} custom={i} variants={fadeUp} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-4xl md:text-5xl font-extrabold text-gradient-purple mb-2">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Product Showcase (Tabs) ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Built for <span className="text-gradient-purple">Enterprise Scale</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete platform for deploying, managing, and optimizing AI agents across your organization.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Tab bar */}
            <div className="flex items-center gap-1 p-1 glass rounded-xl mb-8 max-w-lg mx-auto">
              {["Agent Studio", "Analytics", "Integrations"].map((tab, i) => (
                <button
                  key={tab}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    i === 0
                      ? "bg-gradient-purple text-primary-foreground glow-purple"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Mock dashboard */}
            <div className="glass rounded-2xl p-6 md:p-8 border border-border/50">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Sidebar mock */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <Bot className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">Sales Agent</span>
                    <span className="ml-auto w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  {["Support Agent", "Scheduling Agent", "Survey Agent"].map((name) => (
                    <div key={name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors cursor-pointer">
                      <Bot className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{name}</span>
                    </div>
                  ))}
                </div>

                {/* Main content mock */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Sales Agent — Performance</h3>
                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 font-medium">Live</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Calls Today", val: "1,247" },
                      { label: "Avg Duration", val: "3m 42s" },
                      { label: "Conversion", val: "34.2%" },
                    ].map((m) => (
                      <div key={m.label} className="bg-secondary rounded-xl p-4">
                        <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                        <p className="text-xl font-bold text-foreground">{m.val}</p>
                      </div>
                    ))}
                  </div>
                  {/* Chart placeholder */}
                  <div className="bg-secondary rounded-xl p-6 h-40 flex items-end gap-1">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-purple rounded-t-md transition-all"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Enterprise Security Strip ── */}
      <section className="py-16 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { icon: Shield, label: "SOC 2 Compliant" },
              { icon: Lock, label: "End-to-End Encryption" },
              { icon: Users, label: "Role-Based Access" },
              { icon: Settings, label: "Custom Deployment" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                custom={i}
                variants={fadeUp}
                className="flex items-center gap-3 p-4 rounded-xl glass"
              >
                <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-16 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src={phaosLogo} alt="Phaos AI" className="h-8 w-8 rounded-lg object-cover brightness-150" />
                <span className="text-lg font-bold text-foreground">Phaos AI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-Powered Voice & Agentic Workflow Automation for the modern enterprise.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-4 tracking-wide uppercase">Product</p>
              <ul className="space-y-3">
                {["Voice AI Agents", "Agentic Workflows", "Analytics", "Integrations", "Security"].map((link) => (
                  <li key={link}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{link}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-4 tracking-wide uppercase">Company</p>
              <ul className="space-y-3">
                {["About", "Careers", "Partners", "Investors", "Contact"].map((link) => (
                  <li key={link}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{link}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-4 tracking-wide uppercase">Get in Touch</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Info@PhaosAI.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">(617) 678-2426</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Casselberry, Florida USA</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2026 Phaos AI. All rights reserved.</p>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StyleTile;
