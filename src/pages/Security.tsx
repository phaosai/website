import { motion } from "framer-motion";
import { ArrowRight, Shield, Lock, Eye, Server, FileText, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const securityFeatures = [
  { icon: Lock, title: "End-to-End Encryption", description: "All data is encrypted at rest and in transit using industry-standard protocols. Call recordings, transcripts, and customer data are protected at every touchpoint." },
  { icon: Shield, title: "Role-Based Access Controls", description: "Granular permissions ensure that team members only access the data and features relevant to their role — minimizing risk and maintaining accountability." },
  { icon: Eye, title: "Audit Trails", description: "Comprehensive logging of all data access, modifications, and AI interactions. Full chain of custody for every piece of data in the system." },
  { icon: Server, title: "Secure Cloud Infrastructure", description: "Deployed on enterprise-grade cloud infrastructure (AWS, GCP, Azure) with SOC 2 compliance, redundancy, and disaster recovery built in." },
  { icon: FileText, title: "Data Governance", description: "PII is strictly separated from conversational data used for model training. All data is anonymized for optimization purposes with clear retention policies." },
];

const compliance = [
  { standard: "GDPR", description: "Full compliance with European data protection regulations including right to erasure, data portability, and consent management." },
  { standard: "CCPA", description: "California Consumer Privacy Act compliance with transparent data collection practices and opt-out mechanisms." },
  { standard: "HIPAA", description: "Healthcare data handling standards for customers in regulated industries requiring protected health information safeguards." },
  { standard: "PCI-DSS", description: "Payment Card Industry Data Security Standard compliance for all payment processing and financial data handling." },
  { standard: "SOC 2", description: "Service Organization Control 2 certification demonstrating our commitment to security, availability, and confidentiality." },
  { standard: "TCPA", description: "Telephone Consumer Protection Act compliance for all outbound AI dialing and automated communications." },
];

const Security = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navigation />

      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Security & Compliance</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
              Enterprise-Grade <br />
              <span className="text-gradient-purple">Security First</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Your data security is non-negotiable. Phaos AI is built from the ground up with encryption, access controls, compliance frameworks, and audit trails that meet the most demanding enterprise requirements.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Security <span className="text-gradient-purple">Infrastructure</span></h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, i) => (
              <motion.div key={feature.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl p-6 bg-card border border-border/50 hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Compliance <span className="text-gradient-purple">Standards</span></h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {compliance.map((item, i) => (
              <motion.div key={item.standard} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex items-start gap-4 rounded-2xl p-5 bg-card border border-border/50">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground mb-1">{item.standard}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Questions About <span className="text-gradient-purple">Security</span>?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Our team is happy to walk you through our security architecture and compliance certifications.
            </p>
            <Link to="/contact" className="inline-flex bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 transition-all text-base items-center gap-2 group">
              Schedule a Call <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Security;
