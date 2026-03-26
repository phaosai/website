

# Phaos AI Live Chat Agent — Implementation Plan

## What You'll Get

A floating chat bubble (bottom-right corner) on every page of the site. When clicked, it opens a sleek chat panel that:

1. **Pre-chat form** — Collects the visitor's name, title, company name, and company website before starting the conversation
2. **Personalized AI greeting** — Once they submit, the AI uses their info to craft a tailored opening message (e.g., "Welcome, Sarah! I see you're the VP of Operations at Acme Print Solutions — great to connect.")
3. **Knowledge-grounded responses** — Answers questions about Phaos AI using your bylaws, articles of incorporation, and product roadmap as its knowledge base
4. **Lead gating** — When visitors ask about pricing, specific functionality details, or anything requiring a sales conversation, the AI pivots to collecting their email and phone number, then lets them know someone will reach out
5. **Email delivery** — Captured lead info (name, title, company, website, email, phone, conversation transcript) gets sent to info@phaosai.com

## What I Need From You

1. **Upload the knowledge base documents** — Your Bylaws, Articles of Incorporation, and Product Development Roadmap in text-readable format (PDF, DOCX, or text). I'll extract the content and embed it into the AI's system prompt so it can answer accurately.

2. **Enable Lovable Cloud** — The AI chat requires a backend edge function (to keep the API key secure and handle the AI conversation). You'll need Lovable Cloud enabled on this project. If it's not already, I'll walk you through it.

## Technical Architecture

```text
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Chat Widget     │────▶│  Edge Function        │────▶│  Lovable AI     │
│  (React component│     │  "phaos-chat"         │     │  Gateway        │
│   on every page) │◀────│  - System prompt w/   │◀────│  (Gemini)       │
│                  │     │    knowledge base      │     │                 │
│  Pre-chat form:  │     │  - Lead gating logic   │     └─────────────────┘
│  Name, Title,    │     │  - Email to            │
│  Company, Website│     │    info@phaosai.com    │
└─────────────────┘     └──────────────────────┘
```

### Components to Build

1. **`ChatWidget.tsx`** — Floating bubble + expandable chat panel with:
   - Pre-chat form (name, title, company, website)
   - Message list with streaming AI responses
   - Glassmorphism dark theme matching the site aesthetic
   - Rendered on every page via `App.tsx`

2. **Edge Function `phaos-chat/index.ts`** — Backend that:
   - Receives messages + visitor context (name, title, company, website)
   - Constructs a system prompt with knowledge base content + visitor personalization
   - Streams responses from Gemini via Lovable AI Gateway
   - Detects pricing/functionality questions and instructs the AI to gate

3. **Edge Function `capture-lead/index.ts`** — Receives lead data and sends it to info@phaosai.com (or stores it for email delivery)

### Design Details

- Purple-accent glassmorphism chat panel matching the site's dark theme
- Bot avatar with the Phaos AI branding
- Typing indicator during AI response streaming
- Smooth open/close animations via framer-motion
- Mobile-responsive (full-screen on small devices)

## Steps

1. Upload knowledge base documents → I extract and embed content
2. Enable Lovable Cloud (if not already)
3. Build the chat edge function with knowledge base + lead gating
4. Build the lead capture edge function
5. Build the floating chat widget component
6. Add widget to App.tsx so it appears on every page
7. Test end-to-end

