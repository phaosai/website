import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Terms of Service"
        description="Terms of Service for Phaos AI's voice agent and workflow automation platform."
        canonical="/terms"
        noIndex
      />
      <Navigation />
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-8">
              Terms of <span className="text-gradient-purple">Service</span>
            </h1>
            <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
              <p><strong className="text-foreground">Effective Date:</strong> March 2026</p>

              <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
              <p>By accessing or using the Phaos AI website and services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>

              <h2 className="text-xl font-bold text-foreground">2. Services</h2>
              <p>Phaos AI provides AI-powered voice agent and agentic workflow automation services. Our platform is designed to integrate with your existing business systems to automate customer engagement and operational processes.</p>

              <h2 className="text-xl font-bold text-foreground">3. Use of the Platform</h2>
              <p>You agree to use the platform only for lawful purposes and in accordance with applicable regulations. You may not attempt to interfere with the platform's functionality or security mechanisms.</p>

              <h2 className="text-xl font-bold text-foreground">4. Intellectual Property</h2>
              <p>All content, branding, and technology on this website are the intellectual property of Phaos AI Inc. Unauthorized reproduction or distribution is prohibited.</p>

              <h2 className="text-xl font-bold text-foreground">5. Limitation of Liability</h2>
              <p>Phaos AI shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services. Our total liability is limited to the fees paid for the specific service in question.</p>

              <h2 className="text-xl font-bold text-foreground">6. Modifications</h2>
              <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>

              <h2 className="text-xl font-bold text-foreground">7. Contact</h2>
              <p>For questions about these terms, contact us at <a href="mailto:daniel@phaosai.com" className="text-primary hover:underline">daniel@phaosai.com</a>.</p>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Terms;
