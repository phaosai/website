import { useState, FormEvent, useRef } from "react";
import { toast } from "sonner";
import { Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [reason, setReason] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const mountedAt = useRef(Date.now());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (honeypot || !reason.trim() || submitting || Date.now() - mountedAt.current < 3000) return;

    setSubmitting(true);

    try {
      const id = crypto.randomUUID();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "lead-notification",
          recipientEmail: "daniel@phaosai.com",
          idempotencyKey: `contact-${id}`,
          templateData: {
            source: "Contact Form",
            name: "Website Visitor",
            message: reason.trim(),
          },
        },
      });
      toast.success("Message sent successfully. Our team will reach out shortly.");
      setReason("");
    } catch {
      toast.error("We couldn't send your message right now. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Contact Us | Phaos AI"
        description="Get in touch with Phaos AI. Schedule a call, ask about our platform, or explore a partnership. We're here to help transform your operations."
        canonical="/contact"
      />
      <Navigation />
      <main id="main-content">
        title="Contact Us | Phaos AI"
        description="Get in touch with Phaos AI. Schedule a call, ask about our platform, or explore a partnership. We're here to help transform your operations."
        canonical="/contact"
      />
      <Navigation />

      <section className="relative pt-32 pb-20 px-6 overflow-hidden" aria-label="Contact Form">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight mb-4">
              Get in <span className="text-gradient-purple">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether you have questions about our platform, want to schedule a call, or explore a partnership — we'd love to hear from you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="rounded-3xl p-8 bg-card border border-border/50"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="absolute -left-[9999px]" aria-hidden="true">
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </div>

                 <div>
79:                   <label htmlFor="contact-reason" className="block text-sm font-medium text-foreground mb-2">Reason for Contacting Phaos AI</label>
                   <textarea
                     id="contact-reason"
                     value={reason}
                     onChange={(e) => setReason(e.target.value)}
                     required
                     rows={8}
                     maxLength={1000}
                     placeholder="Tell us how we can help — whether it's a product demo, technical question, partnership opportunity, or anything else..."
                     className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                   />
                    className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !reason}
                  className="w-full bg-gradient-purple text-primary-foreground font-semibold py-3.5 rounded-full glow-purple hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-6"
            >
              <div className="rounded-2xl p-6 bg-card border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Email</p>
                    <a href="mailto:daniel@phaosai.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">daniel@phaosai.com</a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 bg-card border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Phone</p>
                    <a href="tel:+16176782426" className="text-sm text-muted-foreground hover:text-foreground transition-colors">(617) 678-2426</a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 bg-card border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Location</p>
                    <p className="text-sm text-muted-foreground">Casselberry, FL USA</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20">
                <p className="text-foreground font-semibold mb-2">Prefer a call?</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We're happy to schedule a call to discuss exactly how Phaos AI can transform your operations.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
};

export default Contact;
