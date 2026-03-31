import { motion } from "framer-motion";
import { ArrowRight, Phone, Mic, Headphones, BrainCircuit, Calendar, Users, Globe, MessageSquare, Bot, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const features = [
  { icon: Phone, title: "24/7 Intelligent Call Handling", description: "AI answers calls when your team can't — routing to the right department, qualifying leads, and resolving routine inquiries around the clock." },
  { icon: BrainCircuit, title: "Industry-Specific Intelligence", description: "Trained on domain-specific terminology and workflows. Whether it's print production, copier service, or general business operations, the AI speaks your language." },
  { icon: Calendar, title: "Automated Appointment Booking", description: "Integrates with Google Calendar, Outlook, and CRM systems to book sales demos, service calls, and consultations during live conversations." },
  { icon: Users, title: "Lead Qualification & CRM Sync", description: "Captures caller information, qualifies leads by asking the right questions, and pushes data directly into Salesforce, HubSpot, or ConnectWise." },
  { icon: Globe, title: "Real-Time Multilingual Support", description: "Seamlessly switches between languages based on customer cues — a single AI agent can serve a global customer base without language barriers." },
  { icon: Mic, title: "Hyper-Realistic Voice", description: "Proprietary NLU/NLG model with natural pauses, prosody, and sophisticated turn-taking that crosses the uncanny valley." },
  { icon: MessageSquare, title: "Proactive Outbound Dialing", description: "AI-powered outbound calls for appointment reminders, payment collections, upsell campaigns, and customer win-back outreach." },
  { icon: Bot, title: "Seamless Human Handoff", description: "When conversations require a human touch, the AI transfers with full context — no repetition required." },
  { icon: Headphones, title: "Real-Time Agent Assist", description: "AI listens to live calls and provides human agents with on-screen prompts, suggested answers, and contextual sales pitches." },
];

const useCases = [
  "A customer calls to check order status — AI pulls it from Shopify in real-time",
  "Prospect calls for a quote — AI qualifies, captures details, books a follow-up in Google Calendar",
  "Printer reports an error — AI creates a service ticket in ConnectWise and dispatches the nearest tech",
  "Customer calls after hours — AI handles the full conversation, sends SMS confirmation via Twilio",
  "Past customer hasn't ordered in 6 months — AI places a proactive outbound call with a personalized offer",
];

const VoiceAI = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Voice AI Agents | Phaos AI"
        description="Deploy intelligent AI voice agents that handle inbound calls 24/7. Qualify leads, book appointments, and resolve inquiries with natural conversations."
        canonical="/voice-ai"
      />
      <Navigation />

      <section className="relative pt-32 pb-20 px-6 overflow-hidden" aria-label="Voice AI Hero">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Phone className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="text-sm text-primary font-medium">Voice AI Agents</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
              AI That Answers, <br />
              <span className="text-gradient-purple shimmer-light">Qualifies & Resolves</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Deploy intelligent voice agents that handle your inbound call volume 24/7 — qualifying leads, booking appointments, resolving inquiries, and updating your systems in real-time. No hold times. No scripts. Just natural conversations that drive results.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/30" aria-label="Voice AI Capabilities">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful <span className="text-gradient-purple">Capabilities</span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div key={feature.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl p-6 bg-card border border-border/50 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/30" aria-label="Use Cases">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Real-World <span className="text-gradient-purple">Use Cases</span>
            </h2>
            <div className="space-y-4">
              {useCases.map((useCase, i) => (
                <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex items-start gap-4 rounded-2xl p-5 bg-card border border-border/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-foreground leading-relaxed">{useCase}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/30" aria-label="Call to Action">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to <span className="text-gradient-purple">Hear It in Action</span>?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Schedule a call with our team and experience how Phaos AI handles real conversations.
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

export default VoiceAI;
