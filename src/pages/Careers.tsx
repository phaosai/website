import { useState, FormEvent } from "react";
import { toast } from "sonner";
import FormLayout from "@/components/FormLayout";

const Careers = () => {
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Application submitted! We'll be in touch soon.");
      setRole("");
      setMessage("");
      setFileName("");
      setSubmitting(false);
    }, 1000);
  };

  return (
    <FormLayout
      title="Join"
      gradientWord="Phaos AI"
      subtitle="We're looking for passionate builders who want to shape the future of AI-powered business automation."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Honeypot */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Role Applying For</label>
          <textarea
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            rows={3}
            placeholder="Describe the role you're interested in and why you'd be a great fit..."
            className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Resume</label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.rtf"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
              className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Recommended: PDF or DOCX, max 10MB</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Message to the Hiring Manager</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            placeholder="Tell us about yourself, your experience, and what excites you about Phaos AI..."
            className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !role || !message}
          className="w-full bg-gradient-purple text-primary-foreground font-semibold py-3.5 rounded-full glow-purple hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </FormLayout>
  );
};

export default Careers;
