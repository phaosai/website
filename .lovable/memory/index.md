Phaos AI website — dark theme, purple gradient, Inter font, Sierra.ai-inspired aesthetic

## Brand
- Tagline: AI-Powered Voice & Agentic Workflow Automation
- Email: daniel@phaosai.com (primary), Info@PhaosAI.com (footer)
- Phone: (617) 678-2426
- Location: Casselberry, FL USA
- Logo: src/assets/phaos-logo.png
- Hero image: src/assets/phaos-hero.png
- Domain: phaosai.com

## Design System
- Background: #0a0a1a (240 20% 4%)
- Card: #141422 (240 15% 8%)
- Primary: #7c3aed (263 70% 58%)
- Purple Light: #a855f7 (270 80% 68%)
- Purple Deep: #5b21b6 (258 60% 45%)
- Font: Inter (300-900)
- Glass-morphism cards, purple glow effects, framer-motion animations

## Navigation Order
Home → About → Integrations → ROI Calculator → Contact

## Site Structure
- Home (/), About (/about), Integrations (/integrations), ROI Calculator (/roi-calculator), Contact (/contact)
- Voice AI (/voice-ai), Workflows (/workflows), Blog (/blog), Investor Relations (/investor-relations)
- Programmatic SEO: /compare/:competitor, /solutions/:industry
- Security, Privacy, Terms, Careers, Partners, Investors

## Chatbot Rules
- Never route visitors to Shree Dandekar by name
- Say "our team" or "someone from Phaos AI" will reach out
- All technology = "proprietary Phaos AI technology" — never mention 3rd parties
- Lead capture sends to daniel@phaosai.com

## SEO
- react-helmet-async for dynamic meta on every route
- JSON-LD: Organization, SoftwareApplication, FAQPage
- sitemap.xml + robots.txt in /public
- Noscript fallback in index.html
- Google Search Console + Bing verification placeholders ready

## Removals
- Fake chat agent mockup removed from homepage hero
- "Edit with Lovable" badge — cannot remove (platform limitation)
