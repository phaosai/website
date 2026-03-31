import { useState, FormEvent, useRef } from "react";
import { toast } from "sonner";
import FormLayout from "@/components/FormLayout";
import { supabase } from "@/integrations/supabase/client";

const Partners = () => {
  const [inquiry, setInquiry] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    setSubmitting(true);
    try {
      const id = crypto.randomUUID();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "lead-notification",
          recipientEmail: "daniel@phaosai.com",
          idempotencyKey: `partner-${id}`,
          templateData: {
            source: "Partnership Inquiry",
            message: `Inquiry Type: ${inquiry}\n\nMessage: ${message}`,
          },
        },
      });
      toast.success("Partnership inquiry submitted! Our team will follow up shortly.");
      setInquiry("");
      setMessage("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormLayout
      title="Become a"
      gradientWord="Partner"
      subtitle="We're building a partner ecosystem of technology providers, resellers, and strategic allies who want to bring AI automation to their customers."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Inquiry Type</label>
          <textarea
            value={inquiry}
            onChange={(e) => setInquiry(e.target.value)}
            required
            rows={3}
            placeholder="Describe the type of partnership you're interested in — technology, reseller, integration, referral..."
            className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Supporting Documentation</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.rtf,.pptx,.xlsx"
            className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20 cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-1">Optional. PDF, DOCX, or PPTX recommended, max 10MB</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Message to the Head of Partnerships</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            placeholder="Tell us about your organization, the value you see in a partnership, and how you envision working together..."
            className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !inquiry || !message}
          className="w-full bg-gradient-purple text-primary-foreground font-semibold py-3.5 rounded-full glow-purple hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Partnership Inquiry"}
        </button>
      </form>
    </FormLayout>
  );
};

export default Partners;
