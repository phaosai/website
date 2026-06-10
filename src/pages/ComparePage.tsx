import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

interface CompetitorData {
  name: string;
  tagline: string;
  features: { feature: string; phaos: boolean; competitor: boolean }[];
  summary: string;
}

const competitorData: Record<string, CompetitorData> = {
  "legacy-llms": {
    name: "Legacy LLMs",
    tagline: "Why generic AI can't match purpose-built voice automation",
    features: [
      { feature: "Industry-specific training (print, copier, document)", phaos: true, competitor: false },
      { feature: "Real-time voice conversations with emotional intelligence", phaos: true, competitor: false },
      { feature: "Native CRM/ERP integrations", phaos: true, competitor: false },
      { feature: "Outbound AI dialer", phaos: true, competitor: false },
      { feature: "Text-based chat", phaos: true, competitor: true },
      { feature: "General knowledge Q&A", phaos: true, competitor: true },
      { feature: "Agentic workflow automation", phaos: true, competitor: false },
      { feature: "24/7 live call handling", phaos: true, competitor: false },
    ],
    summary: "While legacy LLMs excel at text generation, they lack the real-time voice capabilities, industry-specific training, and end-to-end workflow automation that Phaos AI delivers out of the box.",
  },
  "traditional-ivr": {
    name: "Traditional IVR Systems",
    tagline: "Move beyond rigid phone trees to intelligent conversations",
    features: [
      { feature: "Natural language understanding", phaos: true, competitor: false },
      { feature: "Context-aware conversations", phaos: true, competitor: false },
      { feature: "Emotional intelligence & tone detection", phaos: true, competitor: false },
      { feature: "Self-improving with RLHF", phaos: true, competitor: false },
      { feature: "Basic call routing", phaos: true, competitor: true },
      { feature: "24/7 availability", phaos: true, competitor: true },
      { feature: "Multilingual support", phaos: true, competitor: false },
      { feature: "Proactive outbound engagement", phaos: true, competitor: false },
    ],
    summary: "Traditional IVR forces callers through rigid menu trees. Phaos AI understands intent naturally, resolves queries in real-time, and learns from every interaction to get smarter.",
  },
  "manual-processes": {
    name: "Manual Business Processes",
    tagline: "Stop wasting hours on tasks AI can handle in seconds",
    features: [
      { feature: "Zero manual data entry", phaos: true, competitor: false },
      { feature: "Instant cross-system sync", phaos: true, competitor: false },
      { feature: "Automated follow-up sequences", phaos: true, competitor: false },
      { feature: "Error-free execution", phaos: true, competitor: false },
      { feature: "Scales without hiring", phaos: true, competitor: false },
      { feature: "Works 24/7/365", phaos: true, competitor: false },
      { feature: "Human judgment for edge cases", phaos: true, competitor: true },
      { feature: "No technology required", phaos: false, competitor: true },
    ],
    summary: "Manual processes are error-prone, slow, and impossible to scale. Phaos AI automates the repetitive grind while keeping humans in the loop for decisions that matter.",
  },
  "bland-vs-retell-vs-phaos": {
    name: "Bland AI & Retell AI",
    tagline: "How Phaos AI compares to Bland AI and Retell AI for enterprise voice automation",
    features: [
      { feature: "Hyper-realistic, emotionally-intelligent voice", phaos: true, competitor: true },
      { feature: "24/7 inbound call handling", phaos: true, competitor: true },
      { feature: "Native CRM/ERP integrations (Salesforce, HubSpot, ConnectWise, e-automate)", phaos: true, competitor: false },
      { feature: "End-to-end agentic workflow automation (not just voice)", phaos: true, competitor: false },
      { feature: "Industry-specific deployments (printing, healthcare, real estate, logistics)", phaos: true, competitor: false },
      { feature: "Phaos Conviction Index (PCI) research scoring", phaos: true, competitor: false },
      { feature: "6,000+ app connectivity via Zapier + webhooks", phaos: true, competitor: false },
      { feature: "Enterprise security posture with SOC2-aligned controls", phaos: true, competitor: false },
      { feature: "White-label developer voice APIs", phaos: false, competitor: true },
    ],
    summary: "Bland AI and Retell AI are strong developer-first voice API platforms — great if you want to stitch together your own stack. Phaos AI is built for operators: enterprise-grade security, deep CRM/ERP integration, end-to-end agentic workflows beyond voice, and the Phaos Conviction Index for research-driven decisions, all delivered as a managed solution.",
  },
};

const ComparePage = () => {
  const { competitor } = useParams<{ competitor: string }>();
  const data = competitorData[competitor || ""] || competitorData["legacy-llms"];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title={`Phaos AI vs ${data.name} — AI Voice & Automation Comparison`}
        description={`See how Phaos AI compares to ${data.name}. ${data.tagline}. Discover why businesses choose Phaos AI for voice automation and workflow efficiency.`}
        canonical={`/compare/${competitor}`}
      />
      <Navigation />

      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight mb-4">
              Phaos AI <span className="text-gradient-purple">vs</span> {data.name}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{data.tagline}</p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl overflow-hidden border border-border/50">
            <div className="grid grid-cols-3 bg-card p-4 border-b border-border/50 text-sm font-semibold">
              <span className="text-muted-foreground">Feature</span>
              <span className="text-center text-primary">Phaos AI</span>
              <span className="text-center text-muted-foreground">{data.name}</span>
            </div>
            {data.features.map((f, i) => (
              <motion.div
                key={f.feature}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-3 p-4 border-b border-border/30 last:border-0 text-sm items-center"
              >
                <span className="text-foreground">{f.feature}</span>
                <span className="flex justify-center">
                  {f.phaos ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-destructive/50" />}
                </span>
                <span className="flex justify-center">
                  {f.competitor ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-destructive/50" />}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 rounded-2xl p-6 bg-card border border-border/50"
          >
            <h2 className="text-xl font-bold text-foreground mb-3">The Bottom Line</h2>
            <p className="text-muted-foreground leading-relaxed">{data.summary}</p>
          </motion.div>

          <div className="mt-8 text-center">
            <Link to="/roi-calculator" className="inline-flex bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 transition-all items-center gap-2 group">
              Calculate Your Savings <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ComparePage;
