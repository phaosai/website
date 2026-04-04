/**
 * Centralized data layer — single source of truth for all content.
 * When a headless CMS is adopted, swap these static arrays for fetch calls.
 */

// ── Blog Posts ──
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  authorTitle: string;
  readTime: number;
  date: string;
  category: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "ai-voice-agents-printing-industry",
    title: "How AI Voice Agents Are Revolutionizing the Printing Industry",
    excerpt:
      "The printing and document solutions industry is drowning in manual processes. Here's how AI voice agents are changing everything — from inbound call handling to proactive customer engagement.",
    author: "Daniel Lindros",
    authorTitle: "Founder & CEO",
    readTime: 8,
    date: "2026-03-15",
    category: "Industry Insights",
  },
  {
    slug: "workflow-automation-roi-guide",
    title: "The Complete Guide to Workflow Automation ROI",
    excerpt:
      "How to calculate the real return on investment from automating your manual business processes. Includes frameworks, formulas, and real-world examples.",
    author: "Shree Dandekar",
    authorTitle: "CTO",
    readTime: 12,
    date: "2026-03-10",
    category: "Technical Deep Dive",
  },
  {
    slug: "uncanny-valley-voice-ai",
    title: "Beyond the Uncanny Valley: What Makes Voice AI Feel Human",
    excerpt:
      "Exploring the proprietary technology behind Phaos AI's hyper-realistic voice agents and why emotional intelligence matters more than perfect speech.",
    author: "Daniel Lindros",
    authorTitle: "Founder & CEO",
    readTime: 6,
    date: "2026-03-05",
    category: "Product",
  },
];

/** Future helper — swap for async CMS fetch when ready */
export const getBlogPosts = (): BlogPost[] => blogPosts;
