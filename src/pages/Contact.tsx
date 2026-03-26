import { useState, FormEvent } from "react";
import { toast } from "sonner";
import { Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Contact = () => {
  const [reason, setReason] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Message sent! We'll get back to you soon.");
      setReason("");
      setSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navigation />

      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight mb-4">
              Get in <span className="text-gradient-purple">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether you have questions about our platform, want to schedule a demo, or explore a partnership — we'd love to hear from you.
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
                  <label className="block text-sm font-medium text-foreground mb-2">Reason for Contacting Phaos AI</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={8}
                    placeholder="Tell us how we can help — whether it's a product demo, technical question, partnership opportunity, or anything else..."
                    className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !reason}
                  className="w-full bg-gradient-purple text-primary-foreground font-semibold py-3.5 rounded-full glow-purple hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Email</p>
                    <a href="mailto:Info@PhaosAI.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Info@PhaosAI.com</a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 bg-card border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
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
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Location</p>
                    <p className="text-sm text-muted-foreground">Casselberry, Florida USA</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20">
                <p className="text-foreground font-semibold mb-2">Prefer a call?</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We're happy to schedule a personalized demo and walk you through exactly how Phaos AI can transform your operations.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
