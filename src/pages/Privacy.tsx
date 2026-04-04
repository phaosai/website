import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navigation />
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-8">
              Privacy <span className="text-gradient-purple">Policy</span>
            </h1>
            <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
              <p><strong className="text-foreground">Effective Date:</strong> March 2026</p>

              <h2 className="text-xl font-bold text-foreground">1. Information We Collect</h2>
              <p>We collect information you voluntarily provide through our contact forms, including your name, email address, phone number, and message content. We also collect standard web analytics data such as IP address, browser type, and pages visited.</p>

              <h2 className="text-xl font-bold text-foreground">2. How We Use Your Information</h2>
              <p>Information is used to respond to your inquiries, provide requested services, improve our platform, and communicate relevant updates about Phaos AI. We do not sell or rent your personal information to third parties.</p>

              <h2 className="text-xl font-bold text-foreground">3. Data Security</h2>
              <p>All data is encrypted at rest and in transit using industry-standard protocols. We implement role-based access controls, audit trails, and comply with GDPR, CCPA, HIPAA, and PCI-DSS standards.</p>

              <h2 className="text-xl font-bold text-foreground">4. Data Retention</h2>
              <p>We retain personal data only as long as necessary to fulfill the purposes for which it was collected. You may request deletion of your data at any time by contacting us at info@phaosai.com.</p>

              <h2 className="text-xl font-bold text-foreground">5. Your Rights</h2>
              <p>You have the right to access, correct, or delete your personal data. You may also opt out of communications at any time. For EU residents, additional rights under GDPR apply including data portability and the right to object.</p>

              <h2 className="text-xl font-bold text-foreground">6. Contact</h2>
              <p>For privacy-related inquiries, contact us at <a href="mailto:info@phaosai.com" className="text-primary hover:underline">info@phaosai.com</a>.</p>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Privacy;
