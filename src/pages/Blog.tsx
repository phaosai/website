import { motion } from "framer-motion";
import { Clock, ArrowRight, User } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { blogPostSchema } from "@/lib/seo-schemas";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  authorTitle: string;
  readTime: number;
  date: string;
  category: string;
}

const posts: BlogPost[] = [
  {
    slug: "ai-voice-agents-printing-industry",
    title: "How AI Voice Agents Are Revolutionizing the Printing Industry",
    excerpt: "The printing and document solutions industry is drowning in manual processes. Here's how AI voice agents are changing everything — from inbound call handling to proactive customer engagement.",
    author: "Daniel Lindros",
    authorTitle: "Founder & CEO",
    readTime: 8,
    date: "2026-03-15",
    category: "Industry Insights",
  },
  {
    slug: "workflow-automation-roi-guide",
    title: "The Complete Guide to Workflow Automation ROI",
    excerpt: "How to calculate the real return on investment from automating your manual business processes. Includes frameworks, formulas, and real-world examples.",
    author: "Shree Dandekar",
    authorTitle: "CTO",
    readTime: 12,
    date: "2026-03-10",
    category: "Technical Deep Dive",
  },
  {
    slug: "uncanny-valley-voice-ai",
    title: "Beyond the Uncanny Valley: What Makes Voice AI Feel Human",
    excerpt: "Exploring the proprietary technology behind Phaos AI's hyper-realistic voice agents and why emotional intelligence matters more than perfect speech.",
    author: "Daniel Lindros",
    authorTitle: "Founder & CEO",
    readTime: 6,
    date: "2026-03-05",
    category: "Product",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Blog — AI Voice & Workflow Automation Insights"
        description="Expert insights on AI voice agents, workflow automation, and digital transformation from the Phaos AI team."
        canonical="/blog"
        jsonLd={posts.map((p) => blogPostSchema({ title: p.title, description: p.excerpt, datePublished: p.date, author: p.author, slug: p.slug }))}
      />
      <Navigation />

      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight mb-4">
              The Phaos AI <span className="text-gradient-purple">Blog</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Insights, deep dives, and perspectives on AI, voice technology, and operational automation.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {posts.map((post, i) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="rounded-2xl p-6 md:p-8 bg-card border border-border/50 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">{post.category}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> {post.readTime} min read
                </span>
                <span className="text-xs text-muted-foreground">{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{post.excerpt}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{post.author}</p>
                    <p className="text-xs text-muted-foreground">{post.authorTitle}</p>
                  </div>
                </div>
                <span className="text-sm text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read More <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
