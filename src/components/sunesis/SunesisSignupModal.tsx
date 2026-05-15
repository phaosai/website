import { FormEvent, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, ArrowRight } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import phaosCrown from "@/assets/phaos-crown-transparent.png";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

interface Props {
  open: boolean;
  onClose: () => void;
}

const SunesisSignupModal = ({ open, onClose }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const mountedAt = useRef(Date.now());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (honeypot || submitting || Date.now() - mountedAt.current < 1500) return;

    const parsed = schema.safeParse({ name, email, company, phone, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your input.");
      return;
    }

    setSubmitting(true);
    try {
      const id = crypto.randomUUID();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "lead-notification",
          recipientEmail: "info@phaosai.com",
          idempotencyKey: `sunesis-signup-${id}`,
          templateData: {
            source: "Sunesis Signup",
            name: parsed.data.name,
            email: parsed.data.email,
            phone: parsed.data.phone || undefined,
            message: `Company: ${parsed.data.company || "—"}\n\n${parsed.data.message || "No additional message."}`,
          },
        },
      });
      setSubmitted(true);
    } catch {
      toast.error("We couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setName(""); setEmail(""); setCompany(""); setPhone(""); setMessage("");
    }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg my-8 rounded-3xl overflow-hidden border"
            style={{
              background: "linear-gradient(180deg, #161225 0%, #0b0b0f 100%)",
              borderColor: "rgba(138,43,226,0.25)",
              boxShadow: "0 0 80px rgba(138,43,226,0.25), 0 30px 60px rgba(0,0,0,0.6)",
            }}
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 text-white/60"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="px-6 sm:px-10 py-12 text-center">
                <CheckCircle className="w-14 h-14 mx-auto mb-4 text-emerald-400" />
                <h3 className="text-2xl font-bold text-white mb-2">You're on the list</h3>
                <p className="text-sm text-white/60 max-w-xs mx-auto leading-relaxed">
                  Our team will reach out shortly with next steps for getting you into Phaos Sunesis.
                </p>
                <button
                  onClick={close}
                  className="mt-6 text-sm font-semibold text-[#B97AFF] hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="px-6 sm:px-10 pt-10 pb-4 text-center relative">
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] pointer-events-none"
                    style={{ background: "rgba(138,43,226,0.18)" }}
                    aria-hidden="true"
                  />
                  <img
                    src={phaosCrown}
                    alt=""
                    width={96}
                    height={48}
                    className="mx-auto mb-4 relative z-10 drop-shadow-[0_0_20px_rgba(138,43,226,0.4)]"
                    aria-hidden="true"
                  />
                  <h2 className="relative z-10 text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                    Sign Up for <span style={{ color: "#B97AFF" }}>Phaos Sunesis</span>
                  </h2>
                  <p className="relative z-10 mt-2 text-sm text-white/60">
                    Tell us about yourself and our team will be in touch.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="px-6 sm:px-10 pb-8 pt-2 space-y-4">
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    className="absolute opacity-0 pointer-events-none -left-[9999px]"
                    aria-hidden="true"
                  />

                  <Field label="Full Name" required>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      className={fieldClass}
                    />
                  </Field>

                  <Field label="Email" required>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      inputMode="email"
                      className={fieldClass}
                    />
                  </Field>

                  <Field label="Company">
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      autoComplete="organization"
                      className={fieldClass}
                    />
                  </Field>

                  <Field label="Phone">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      inputMode="tel"
                      className={fieldClass}
                    />
                  </Field>

                  <Field label="What are you hoping to use Sunesis for?">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className={`${fieldClass} resize-none`}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #8A2BE2, #6B21A8)",
                      boxShadow: "0 0 25px rgba(138,43,226,0.35)",
                    }}
                  >
                    {submitting ? "Submitting..." : (<>Submit <ArrowRight className="w-4 h-4" /></>)}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const fieldClass =
  "w-full rounded-xl px-4 py-3 text-base text-white placeholder:text-white/25 bg-[rgba(255,255,255,0.06)] border border-[rgba(138,43,226,0.22)] focus:outline-none focus:border-[rgba(138,43,226,0.55)] focus:ring-2 focus:ring-[rgba(138,43,226,0.25)]";

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold tracking-[0.15em] uppercase text-white/55 mb-1.5">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
  </div>
);

export default SunesisSignupModal;
