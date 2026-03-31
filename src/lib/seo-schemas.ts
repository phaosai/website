const BASE_URL = "https://phaosai.com";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Phaos AI",
  url: BASE_URL,
  logo: `${BASE_URL}/phaos-logo.png`,
  description: "AI-Powered Voice & Agentic Workflow Automation for the modern enterprise.",
  foundingDate: "2025-07-26",
  founders: [{ "@type": "Person", name: "Daniel Lindros", jobTitle: "Founder & CEO" }],
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
    email: "daniel@phaosai.com",
  },
  sameAs: [],
};

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Phaos AI",
  url: BASE_URL,
  logo: `${BASE_URL}/phaos-logo.png`,
  image: `${BASE_URL}/phaos-hero.png`,
  description: "AI-powered voice agents and workflow automation provider serving SMBs and mid-market enterprises from Casselberry, Florida.",
  telephone: "+1-617-678-2426",
  email: "daniel@phaosai.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "340 Georgetown Drive, Unit B",
    addressLocality: "Casselberry",
    addressRegion: "FL",
    postalCode: "32707",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 28.6578,
    longitude: -81.3278,
  },
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  priceRange: "$$",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "18:00",
  },
};

export const professionalServiceSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Phaos AI",
  url: BASE_URL,
  description: "B2B AI automation services including voice AI agents and agentic workflow automation for copier dealerships, healthcare, real estate, and SMB operations.",
  telephone: "+1-617-678-2426",
  email: "daniel@phaosai.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "340 Georgetown Drive, Unit B",
    addressLocality: "Casselberry",
    addressRegion: "FL",
    postalCode: "32707",
    addressCountry: "US",
  },
  serviceType: ["AI Voice Agents", "Workflow Automation", "Business Process Automation"],
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
};

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Phaos AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "AI-powered voice agents and agentic workflow automation platform. Deploy intelligent AI to manage inbound calls and automate complex business operations.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Contact for pricing",
  },
  creator: organizationSchema,
};

export const roiCalculatorSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Phaos AI ROI Calculator",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Calculate your savings from Voice AI agents and workflow automation. Free interactive tool to estimate ROI from Phaos AI implementation.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: "Voice AI ROI calculation, Workflow automation savings, Custom analysis",
};

export const voiceAIServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Voice AI Agents",
  provider: organizationSchema,
  description: "AI-powered voice agents that answer inbound calls 24/7 with hyper-realistic, emotionally intelligent conversations. Qualify leads, book appointments, and handle FAQs autonomously.",
  serviceType: "AI Voice Agent",
  areaServed: { "@type": "Country", name: "United States" },
  url: `${BASE_URL}/voice-ai`,
};

export const workflowServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Agentic Workflow Automation",
  provider: organizationSchema,
  description: "Eliminate manual data entry, paper forms, and repetitive tasks with autonomous agentic workflows that connect your systems and execute end-to-end processes.",
  serviceType: "Workflow Automation",
  areaServed: { "@type": "Country", name: "United States" },
  url: `${BASE_URL}/workflows`,
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

export const homeFaqSchema = {
  "@context": "https://schema.org",
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
};

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
  author: { "@type": "Person", name: post.author },
  publisher: organizationSchema,
  url: `${BASE_URL}/blog/${post.slug}`,
  image: post.image || `${BASE_URL}/og-default.png`,
});
