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
