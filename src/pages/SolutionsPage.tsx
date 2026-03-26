import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

interface IndustryData {
  name: string;
  headline: string;
  description: string;
  painPoints: string[];
  solutions: string[];
  roi: string[];
}

const industryData: Record<string, IndustryData> = {
  "printing": {
    name: "Printing & Document Solutions",
    headline: "AI-Powered Automation for the Print Industry",
    description: "The printing industry runs on high call volumes, complex service workflows, and legacy systems. Phaos AI was built to solve these exact challenges.",
    painPoints: ["High volume of repetitive service calls", "Manual dispatch and scheduling", "Disconnected CRM and ERP systems", "Paper-heavy order and quote processes"],
    solutions: ["24/7 AI call answering with print-specific FAQ handling", "Automated service dispatch and technician routing", "Real-time CRM/ERP data sync", "AI-generated quotes and proposals"],
    roi: ["$100,000+ annual savings for a dealership with 5 service calls/day", "10-25% reduction in admin labor costs", "5-10% increase in qualified lead capture", "20-30% reduction in no-show rates"],
  },
  "healthcare": {
    name: "Healthcare",
    headline: "HIPAA-Compliant Voice AI for Healthcare Operations",
    description: "Healthcare organizations need reliable, compliant patient communication. Phaos AI delivers — with full HIPAA awareness and human-like patient interactions.",
    painPoints: ["Missed patient calls and long hold times", "Appointment no-shows costing thousands", "Manual insurance verification", "Staff burnout from repetitive call handling"],
    solutions: ["24/7 patient call handling with empathetic AI", "Automated appointment reminders reducing no-shows", "AI-powered insurance pre-verification", "Seamless handoff to clinical staff"],
    roi: ["20-30% reduction in appointment no-shows", "15-25% decrease in front-desk labor costs", "Recovered revenue from previously missed calls", "Improved patient satisfaction scores"],
  },
  "real-estate": {
    name: "Real Estate",
    headline: "Never Miss a Lead with AI Voice Agents",
    description: "In real estate, every missed call is a missed commission. Phaos AI ensures every inquiry gets an instant, professional response — day or night.",
    painPoints: ["Leads calling after hours go unanswered", "Agents overwhelmed by showing requests", "Manual follow-up sequences fall through", "No consistent lead qualification process"],
    solutions: ["24/7 lead capture and qualification", "Automated showing scheduling", "AI-powered follow-up sequences", "CRM-integrated call summaries"],
    roi: ["5-10% increase in lead conversion", "Recovered revenue from after-hours inquiries", "15+ hours/week saved on manual follow-ups", "Consistent lead qualification at scale"],
  },
};

const SolutionsPage = () => {
  const { industry } = useParams<{ industry: string }>();
  const data = industryData[industry || ""] || industryData["printing"];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title={`${data.name} AI Solutions — Voice & Workflow Automation`}
        description={`${data.headline}. Discover how Phaos AI transforms ${data.name.toLowerCase()} operations with intelligent voice agents and workflow automation.`}
        canonical={`/solutions/${industry}`}
      />
      <Navigation />

      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-sm text-primary font-medium bg-primary/10 px-3 py-1 rounded-full">{data.name}</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight mt-4 mb-4">
              {data.headline.split(" ").slice(0, -2).join(" ")}{" "}
              <span className="text-gradient-purple">{data.headline.split(" ").slice(-2).join(" ")}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{data.description}</p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { title: "Pain Points We Solve", items: data.painPoints, color: "destructive" },
            { title: "Phaos AI Solutions", items: data.solutions, color: "primary" },
            { title: "Expected ROI", items: data.roi, color: "success" },
          ].map(({ title, items, color }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl p-6 bg-card border border-border/50"
            >
              <h2 className="text-lg font-bold text-foreground mb-4">{title}</h2>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${
                      color === "primary" ? "text-primary" : color === "success" ? "text-green-400" : "text-destructive"
                    }`} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/roi-calculator" className="inline-flex bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 transition-all items-center gap-2 group">
            Calculate Your {data.name} ROI <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SolutionsPage;
