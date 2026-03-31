import { useState, FormEvent } from "react";
import { toast } from "sonner";
import FormLayout from "@/components/FormLayout";
import { supabase } from "@/integrations/supabase/client";

const Investors = () => {
  const [investmentType, setInvestmentType] = useState("");
  const [amount, setAmount] = useState("");
  const [structure, setStructure] = useState("");
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
          idempotencyKey: `investor-${id}`,
          templateData: {
            source: "Investor Inquiry",
            message: `Investment Type: ${investmentType}\n\nAmount: ${amount}\n\nStructure: ${structure}\n\nMessage: ${message}`,
          },
        },
      });
      toast.success("Investment inquiry submitted! Daniel will follow up personally.");
      setInvestmentType("");
      setAmount("");
      setStructure("");
      setMessage("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormLayout
      title="Invest in"
      gradientWord="Phaos AI"
      subtitle="We're actively seeking strategic investors who share our vision of transforming enterprise operations through AI."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Investment Type</label>
          <textarea
            value={investmentType}
            onChange={(e) => setInvestmentType(e.target.value)}
            required
            rows={3}
            placeholder="Describe the type of investment — angel, seed, venture capital, strategic partnership, etc."
            className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Investment Amount</label>
          <textarea
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            rows={1}
            placeholder="Approximate investment amount or range"
            className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Investment Structure</label>
          <textarea
            value={structure}
            onChange={(e) => setStructure(e.target.value)}
            required
            rows={3}
            placeholder="Describe your preferred investment structure — equity, convertible note, SAFE, revenue share, etc."
            className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Message to the Founder</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            placeholder="Tell us about your investment thesis, what excites you about Phaos AI, and any questions you have for Daniel..."
            className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !investmentType || !amount || !structure || !message}
          className="w-full bg-gradient-purple text-primary-foreground font-semibold py-3.5 rounded-full glow-purple hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Investment Inquiry"}
        </button>
      </form>
    </FormLayout>
  );
};

export default Investors;
