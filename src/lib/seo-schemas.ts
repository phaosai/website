const BASE_URL = "https://phaosai.com";

// ── Core Entity IDs ──
const ORG_ID = `${BASE_URL}/#organization`;
const FOUNDER_ID = `${BASE_URL}/#founder`;
const WEBSITE_ID = `${BASE_URL}/#website`;
const VOICE_SERVICE_ID = `${BASE_URL}/voice-ai#service`;
const WORKFLOW_SERVICE_ID = `${BASE_URL}/workflows#service`;

// ── Person: Founder ──
const founderPerson = {
  "@type": "Person",
  "@id": FOUNDER_ID,
  name: "Daniel Lindros",
  jobTitle: "Founder & CEO",
  worksFor: { "@id": ORG_ID },
  url: `${BASE_URL}/about`,
  sameAs: [] as string[],
};

// ── Organization ──
const organizationNode = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Phaos AI",
  url: BASE_URL,
  logo: `${BASE_URL}/phaos-logo.jpg`,
  description:
    "AI-Powered Voice & Agentic Workflow Automation for the modern enterprise.",
  foundingDate: "2025-07-26",
  founder: { "@id": FOUNDER_ID },
  address: {
    "@type": "PostalAddress",
    streetAddress: "340 Georgetown Drive, Unit B",
    addressLocality: "Casselberry",
    addressRegion: "FL",
    postalCode: "32707",
    addressCountry: "US",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+1-617-678-2426",
    contactType: "sales",
    email: "info@phaosai.com",
  },
  sameAs: [] as string[],
};

// ── WebSite ──
const websiteNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "Phaos AI",
  url: BASE_URL,
  publisher: { "@id": ORG_ID },
};

// ── Services ──
const voiceServiceNode = {
  "@type": "Service",
  "@id": VOICE_SERVICE_ID,
  name: "Voice AI Agents",
  provider: { "@id": ORG_ID },
  description:
    "AI-powered voice agents that answer inbound calls 24/7 with hyper-realistic, emotionally intelligent conversations. Qualify leads, book appointments, and handle FAQs autonomously.",
  serviceType: "AI Voice Agent",
  areaServed: { "@type": "Country", name: "United States" },
  url: `${BASE_URL}/voice-ai`,
};

const workflowServiceNode = {
  "@type": "Service",
  "@id": WORKFLOW_SERVICE_ID,
  name: "Agentic Workflow Automation",
  provider: { "@id": ORG_ID },
  description:
    "Eliminate manual data entry, paper forms, and repetitive tasks with autonomous agentic workflows that connect your systems and execute end-to-end processes.",
  serviceType: "Workflow Automation",
  areaServed: { "@type": "Country", name: "United States" },
  url: `${BASE_URL}/workflows`,
};

// ── Speakable helper ──
const speakable = (cssSelectors: string[]) => ({
  "@type": "SpeakableSpecification",
  cssSelector: cssSelectors,
});

// ── Public Exports ──

/** Unified @graph for the homepage — single connected knowledge graph */
export const homeGraphSchema = {
  "@context": "https://schema.org",
  "@graph": [
    founderPerson,
    organizationNode,
    websiteNode,
    voiceServiceNode,
    workflowServiceNode,
    {
      "@type": "SoftwareApplication",
      name: "Phaos AI",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "AI-powered voice agents and agentic workflow automation platform. Deploy intelligent AI to manage inbound calls and automate complex business operations.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Contact for pricing",
      },
      creator: { "@id": ORG_ID },
    },
    {
      "@type": "LocalBusiness",
      name: "Phaos AI",
      url: BASE_URL,
      logo: `${BASE_URL}/phaos-logo.jpg`,
      image: `${BASE_URL}/phaos-hero.jpg`,
      description:
        "AI-powered voice agents and workflow automation provider serving SMBs and mid-market enterprises from Casselberry, Florida.",
      telephone: "+1-617-678-2426",
      email: "info@phaosai.com",
      address: organizationNode.address,
      geo: { "@type": "GeoCoordinates", latitude: 28.6578, longitude: -81.3278 },
      areaServed: { "@type": "Country", name: "United States" },
      priceRange: "$$",
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    },
    {
      "@type": "ProfessionalService",
      name: "Phaos AI",
      url: BASE_URL,
      description:
        "B2B AI automation services including voice AI agents and agentic workflow automation for copier dealerships, healthcare, real estate, and SMB operations.",
      telephone: "+1-617-678-2426",
      email: "info@phaosai.com",
      address: organizationNode.address,
      serviceType: ["AI Voice Agents", "Workflow Automation", "Business Process Automation"],
      areaServed: { "@type": "Country", name: "United States" },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Phaos AI?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Phaos AI is an AI-powered platform that deploys intelligent voice agents to manage inbound calls and agentic workflows to automate complex business operations. Built on proprietary AI technology, it eliminates manual processes with seamless, human-free automation.",
          },
        },
        {
          "@type": "Question",
          name: "How does Phaos AI Voice Agent work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Phaos AI voice agents answer calls 24/7 with hyper-realistic, emotionally intelligent conversations. They qualify leads, book appointments, handle FAQs, and seamlessly hand off to human agents when needed — all while integrating with your CRM and business systems.",
          },
        },
        {
          "@type": "Question",
          name: "What industries does Phaos AI serve?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "While Phaos AI has deep expertise in the printing, copier, and document solutions industry, the platform serves all businesses that need AI-powered voice agents and workflow automation — including healthcare, financial services, real estate, logistics, and more.",
          },
        },
        {
          "@type": "Question",
          name: "How much can I save with Phaos AI?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Savings vary by business size and call volume. A copier dealership with 5 service calls per day can save over $100,000 annually. Use our free ROI Calculator to estimate your specific savings from voice AI and workflow automation.",
          },
        },
        {
          "@type": "Question",
          name: "Does Phaos AI integrate with my existing systems?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Phaos AI offers native Zapier integrations with 6,000+ apps, webhook connectivity for custom systems, and direct integrations with popular CRMs, ERPs, and print industry software including Salesforce, HubSpot, ConnectWise, e-automate, and many more.",
          },
        },
      ],
      speakable: speakable(["[aria-label='Hero'] h1", "[aria-label='Hero'] p"]),
    },
  ],
};

export const roiCalculatorSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Phaos AI ROI Calculator",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Calculate your savings from Voice AI agents and workflow automation. Free interactive tool to estimate ROI from Phaos AI implementation.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: "Voice AI ROI calculation, Workflow automation savings, Custom analysis",
};

export const voiceAIPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    { ...voiceServiceNode },
    {
      "@type": "WebPage",
      name: "Voice AI Agents — Phaos AI",
      url: `${BASE_URL}/voice-ai`,
      speakable: speakable(["h1", "[aria-label='Hero'] p"]),
    },
  ],
};

export const workflowPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    { ...workflowServiceNode },
    {
      "@type": "WebPage",
      name: "Agentic Workflow Automation — Phaos AI",
      url: `${BASE_URL}/workflows`,
      speakable: speakable(["h1", "[aria-label='Hero'] p"]),
    },
  ],
};

export const aboutPageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      name: "About Phaos AI",
      url: `${BASE_URL}/about`,
      mainEntity: { "@id": ORG_ID },
    },
    { ...organizationNode },
    { ...founderPerson },
  ],
};

export const breadcrumbSchema = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: `${BASE_URL}${item.path}`,
  })),
});

export const blogPostSchema = (post: {
  title: string;
  description: string;
  datePublished: string;
  author: string;
  slug: string;
  image?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.description,
  datePublished: post.datePublished,
  dateModified: post.datePublished,
  author: {
    "@type": "Person",
    name: post.author,
    url: `${BASE_URL}/about`,
  },
  publisher: { "@id": ORG_ID, name: "Phaos AI", logo: `${BASE_URL}/phaos-logo.jpg` },
  url: `${BASE_URL}/blog/${post.slug}`,
  image: post.image || `${BASE_URL}/og-default.png`,
  speakable: speakable(["h2", "p"]),
});
