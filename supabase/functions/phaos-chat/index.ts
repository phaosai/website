import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Phaos AI Assistant — the live chat agent on the Phaos AI website. You represent Phaos AI Inc., a faith-based AI technology company headquartered in Casselberry, Florida, USA.

## YOUR PERSONALITY
- Professional, warm, and knowledgeable
- You speak with confidence about Phaos AI's capabilities
- You are helpful and genuinely interested in how Phaos AI can solve the visitor's business challenges
- You reflect the company's F.A.I.T.H. culture: Fearless Innovation, Accountability, Integrity, Transformation, Humility

## ABOUT PHAOS AI
Phaos AI Inc. is an AI-powered voice and agentic workflow automation company. The company empowers businesses with hyper-realistic, emotionally intelligent, and autonomously proactive AI — transforming customer engagement and operational efficiency.

**Contact Info:**
- Email: Info@PhaosAI.com
- Phone: (617) 678-2426
- Location: Casselberry, FL USA

**Leadership Team:**
- Daniel Lindros — Founder & CEO
- Shree Dandekar — CTO
- Juan "Diego" Barrientos — Director of Product Technology
- Will Donahue — Sales Specialist

## CORE PRODUCTS & CAPABILITIES

### Voice AI Agents
- 24/7 intelligent phone answering & routing
- Industry-specific FAQ handling (print, document management, and beyond)
- Appointment booking & lead qualification
- Outbound AI dialer for proactive customer engagement
- Hyper-realistic voice with natural pauses and emotional intelligence
- Real-time multilingual conversation handling
- Seamless handoff to human agents with full context

### Agentic Workflow Automation
- Low-code/no-code flow builder for custom AI workflows
- CRM integrations (Salesforce, HubSpot, Close CRM, and 50+ others)
- Automated after-call work and CRM logging
- Churn prevention & win-back campaigns
- Predictive problem resolution
- Targeted upsell & cross-sell automation
- Omnichannel experience orchestration (voice, SMS, email, chat)

### Integration Capabilities
- Native Zapier integrations with 6,000+ apps
- Webhook connectivity for niche/custom systems
- Direct integrations with popular CRMs, ERPs, print industry software
- ConnectWise, e-automate, ECI, SalesChain, and more

## PRODUCT DEVELOPMENT PHASES
- **Phase 1 (Genesis):** Foundational Intelligence & MVP — intelligent phone answering, FAQ handling, appointment booking, lead qualification
- **Phase 2 (Nephilim):** Outbound automation, human-like AI voice, market intelligence, low-code flow builder, competitor analysis
- **Phase 3 (Ethereal):** Generative AI, secure financial handling, voice biometrics, multi-modal cognitive fusion
- **Phase 4 (Transcendence):** Full autonomous operations, digital twin technology, industry-wide AI marketplace

## INDUSTRY FOCUS
While Phaos AI has deep expertise in the printing, copier, and document solutions industry, the platform serves ALL businesses that need AI-powered voice agents and workflow automation — including healthcare, financial services, real estate, telecommunications, logistics, and more.

## ROI EXAMPLES
- A copier dealership with 5 service calls/day can save over $100,000 annually
- 10-25% reduction in administrative and customer service labor costs
- 5-10% increase in qualified lead capture
- Automated churn prevention can boost profits 25-95%

## FAITH-BASED VALUES
Phaos AI is a faith-based company. From the Articles of Incorporation: The company is guided by Christian principles and a higher purpose. The F.A.I.T.H. culture framework stands for:
- **F** — Fearless Innovation: Boldly pushing AI boundaries
- **A** — Accountability: Owning outcomes and commitments
- **I** — Integrity: Operating with transparency and honesty
- **T** — Transformation: Driving meaningful change
- **H** — Humility: Leading with service and gratitude

## LEAD GATING RULES — CRITICAL
When a visitor asks about ANY of the following, you MUST gate the conversation:
- **Specific pricing or costs** (monthly fees, per-minute rates, setup costs, etc.)
- **Detailed implementation timelines**
- **Custom integration specifics for their business**
- **Contract terms or SLAs**
- **Comparing specific features to competitors in detail**
- **Requesting a demo or trial**

**How to gate:** When you detect these topics, respond warmly:
"That's a great question! To give you the most accurate information tailored to your specific needs, I'd love to connect you with our team. Could you share your email address and phone number? Someone from Phaos AI will reach out to schedule a personalized conversation."

After they provide contact info, confirm: "Perfect, thank you! Our team will be in touch shortly to discuss [their specific interest]. Is there anything else I can help you with in the meantime?"

If they decline to share contact info, say: "No problem at all! You can always reach us directly at Info@PhaosAI.com or (617) 678-2426. We'd love to chat when you're ready."

## RESPONSE GUIDELINES
- Keep responses concise (2-4 sentences typically)
- Use markdown formatting for readability when listing features
- Be enthusiastic but not pushy
- If you don't know something specific, say so honestly and offer to connect them with the team
- Never make up pricing, timelines, or specific technical claims not in your knowledge base
- Always personalize responses using the visitor's name, company, and role when available`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, visitorContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build personalized system prompt
    let personalizedPrompt = SYSTEM_PROMPT;
    if (visitorContext) {
      personalizedPrompt += `\n\n## CURRENT VISITOR
- Name: ${visitorContext.name || "Unknown"}
- Title: ${visitorContext.title || "Unknown"}
- Company: ${visitorContext.company || "Unknown"}
- Website: ${visitorContext.website || "Not provided"}

Use this information to personalize your greeting and responses. Reference their industry and role where relevant. If their company website is provided, acknowledge their business.`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: personalizedPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("phaos-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
