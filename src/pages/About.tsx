import { motion } from "framer-motion";
import { ArrowRight, Target, Eye, Heart, Lightbulb, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { aboutPageSchema } from "@/lib/seo-schemas";
import danielPhoto from "@/assets/daniel-lindros.jpg";
import shreePhoto from "@/assets/shree-dandekar.jpg";
import diegoPhoto from "@/assets/diego-barrientos.jpg";
import toriPhoto from "@/assets/tori-mccrea.jpg";
import kaitlynPhoto from "@/assets/kaitlyn-hathaway.jpeg";
import willPhoto from "@/assets/will-donahue.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="About Phaos AI — Our Team & Mission"
        description="Meet the team behind Phaos AI. Learn about our mission to transform enterprise operations through AI-powered voice agents and workflow automation."
        canonical="/about"
        jsonLd={aboutPageSchema}
      />
      <Navigation />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
              About <span className="text-gradient-purple">Phaos AI</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We're building the AI infrastructure that transforms how businesses engage customers and run operations — starting with the industries that need it most.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="rounded-3xl p-8 bg-gradient-to-br from-primary/15 via-card to-card border border-primary/20">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
              <Eye className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Our Vision</h2>
            <p className="text-muted-foreground leading-relaxed">
              To empower businesses across industries with hyper-realistic, emotionally intelligent, and autonomously proactive AI — transforming customer engagement and operational efficiency from reactive support to predictive, personalized care.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.15 }} className="rounded-3xl p-8 bg-gradient-to-br from-purple-deep/15 via-card to-card border border-purple-deep/20">
            <div className="w-14 h-14 rounded-2xl bg-purple-deep/15 flex items-center justify-center mb-6">
              <Target className="w-7 h-7 text-purple-light" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              Phaos AI began as an AI-powered voice and workflow automation company serving B2B businesses. We have expanded that same commitment to operational intelligence into a full financial research environment—because the same discipline that improves how a business handles inbound calls also improves how an investor handles inbound signals. We don't just process information; we architect conviction.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Core <span className="text-gradient-purple">Principles</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: "Human-Centric AI", description: "We design AI that enhances human capabilities and interactions — not replaces them entirely." },
              { icon: Shield, title: "Ethical & Transparent", description: "We build AI with inherent ethical guidelines, ensuring fairness, privacy, and explainability at every level." },
              { icon: Lightbulb, title: "Scalability & Adaptability", description: "A flexible architecture capable of rapid expansion into new verticals and evolving industry needs." },
              { icon: Target, title: "Continuous Learning", description: "A culture of iterative development and data-driven optimization — because growth is a journey of refinement." },
              { icon: Eye, title: "Customer ROI First", description: "Every feature must demonstrably contribute to customer ROI and market leadership." },
            ].map((principle, i) => (
              <motion.div
                key={principle.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl p-6 bg-card border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <principle.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{principle.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{principle.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Foundation */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our <span className="text-gradient-purple">Foundation</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg">
              The name <strong className="text-foreground">Phaos</strong> comes from the Koine Greek word for <em>"light"</em> — rooted in <span className="text-primary">John 1:4-5</span>: <em>"In Him was life, and that life was the light of all mankind. The light shines in the darkness, and the darkness has not overcome it."</em>
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-4">
              We are a faith-based company, and our values reflect the principles that guide everything we build.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              { letter: "F", word: "Freedom", description: "Empowering businesses to break free from manual processes and operate with autonomy." },
              { letter: "A", word: "Authenticity", description: "Building genuine technology that reflects honest, transparent relationships." },
              { letter: "I", word: "Integrity", description: "Upholding the highest ethical standards in every line of code and every interaction." },
              { letter: "T", word: "Transformation", description: "Driving meaningful change — in operations, in outcomes, and in people's lives." },
              { letter: "H", word: "Humility", description: "Leading with servant-leadership, putting our customers and community first." },
            ].map((value, i) => (
              <motion.div
                key={value.letter}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl p-6 bg-gradient-to-b from-primary/10 via-card to-card border border-primary/20 text-center hover:border-primary/40 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">{value.letter}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{value.word}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
              </motion.div>
            ))}

            {/* F.A.I.T.H. Summary Card */}
            <motion.div
              custom={5}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="rounded-2xl p-6 bg-gradient-to-br from-primary/20 via-purple-deep/15 to-card border border-primary/30 text-center hover:border-primary/50 transition-all flex flex-col justify-center"
            >
              <h3 className="text-2xl font-bold text-foreground mb-1 tracking-wide">
                <span className="text-primary">F</span>.<span className="text-primary">A</span>.<span className="text-primary">I</span>.<span className="text-primary">T</span>.<span className="text-primary">H</span>.
              </h3>
              <p className="text-sm text-primary font-medium mb-3">Our Culture Framework</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Phaos AI operates as a faith-based company rooted in Biblical principles. Our culture is built on servant-leadership, ethical stewardship, and the belief that technology should uplift people — not replace their dignity. Every decision we make is guided by these values, ensuring we build with purpose, lead with humility, and serve with integrity.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We're Building */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              What We're <span className="text-gradient-purple">Building</span>
            </h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed text-lg">
              <p>
                Phaos AI is developing a dual-platform solution: <strong className="text-foreground">Voice AI Agents</strong> that handle inbound and outbound calls with human-like intelligence, and <strong className="text-foreground">Agentic Workflows</strong> that automate complex, multi-step business processes end-to-end.
              </p>
              <p>
                We started by tackling the printing, copier, and document solutions industry — a sector drowning in manual processes, paper-heavy workflows, and excessive customer touchpoints. But our technology is built to serve any business that relies on high call volumes, repetitive operations, and disconnected systems.
              </p>
              <p>
                From automated service dispatching and intelligent call routing to proactive customer outreach and cross-platform data sync, Phaos AI replaces the manual grind with seamless, autonomous automation.
              </p>
            </div>
          </motion.div>
        </div>
      </section>



      {/* Team Section */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              Meet the <span className="text-gradient-purple">Team</span>
            </h2>
          </motion.div>

          {/* Daniel Lindros */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl p-8 md:p-12 bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 mb-8"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-48 h-48 rounded-2xl overflow-hidden shrink-0 border-2 border-primary/30">
                <img src={danielPhoto} alt="Daniel Lindros — Founder & CEO of Phaos AI" width={192} height={192} loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">Daniel Lindros</h3>
                <p className="text-primary font-medium mb-4">Founder & CEO</p>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    From washing dishes at age 14 to leading Phaos AI, Daniel's career has been defined by a simple principle: doing the hard work required to build things that last. Long before he was engineering AI-driven workflows, Daniel cut his teeth in high-stakes enterprise technology, driving growth for industry titans like Xerox and Canon. Over a decade of B2B leadership, he didn't just sell software; he partnered with some of the world's most complex organizations—including the Department of Defense, Harvard Business School, and Disney—to solve their most deeply rooted inefficiencies.
                  </p>
                  <p>
                    At Phaos AI, Daniel merges extensive hard-won startup experience with a rigorous, Lean Six Sigma mindset. To him, artificial intelligence isn't just about bleeding-edge novelty; it's about operational utility. He excels at simplifying the complex, translating autonomous systems into practical, high-growth foundations that drive measurable, bottom-line success for customers.
                  </p>
                  <p>
                    Daniel's leadership is profoundly shaped by his faith and studies in divinity. He approaches business with a servant's heart, viewing leadership as a daily responsibility to elevate his team and fiercely protect his clients' interests. Outside the office, Daniel is a devoted father to his son, Davis. He stays grounded through prayer, playing the piano, and pushing his physical limits at the gym. At his core, Daniel remains committed to proving that relentless technical innovation and a genuine love for people are not mutually exclusive, ensuring Phaos AI stands as a company built on purpose, integrity, excellence and love.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Shree Dandekar */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="rounded-3xl p-8 md:p-12 bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 mb-8"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-48 h-48 rounded-2xl overflow-hidden shrink-0 border-2 border-primary/30">
                <img src={shreePhoto} alt="Shree Dandekar — CTO of Phaos AI" width={192} height={192} loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">Shree Dandekar</h3>
                <p className="text-primary font-medium mb-4">Chief Technology Officer</p>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Shree Dandekar is an inspirational technology leader, inventor, and product strategist with over 30 years of experience driving software innovation across Fortune 500 industries and global markets. A growth architect at heart, Shree has spent his career turning complex technical challenges into scalable, revenue-generating solutions — spanning enterprise software, AI, and digital transformation.
                  </p>
                  <p>
                    His deep expertise in product development, engineering leadership, and go-to-market execution — combined with a proven track record of building and scaling high-performing technology teams — makes him the ideal architect behind Phaos AI's platform. Shree brings the technical rigor and visionary product thinking needed to deliver AI that doesn't just work — it sets new benchmarks.
                  </p>
                  <p>
                    With a career that began as a software engineer at Dell and evolved through senior leadership roles across multiple industries, Shree brings a rare blend of hands-on technical depth and executive strategic perspective to Phaos AI.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Diego Barrientos */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-3xl p-8 md:p-12 bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 mb-8"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-48 h-48 rounded-2xl overflow-hidden shrink-0 border-2 border-primary/30">
                <img src={diegoPhoto} alt="Juan Diego Barrientos — Director of Product Technology at Phaos AI" width={192} height={192} loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">Juan "Diego" Barrientos</h3>
                <p className="text-primary font-medium mb-4">Director of Product Technology</p>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Diego Barrientos is a versatile product technology leader with deep expertise in quality assurance, user experience research, and full-stack development. His career has been defined by a relentless focus on building software that works flawlessly — from rigorous QA methodologies to intuitive user-facing design.
                  </p>
                  <p>
                    His hands-on experience conducting user research studies, performing quality assurance across complex platforms, and shipping production-grade software gives him a unique lens on product development — one that prioritizes both technical excellence and real-world usability. Diego ensures that every feature Phaos AI delivers meets the highest standards of reliability and user experience.
                  </p>
                  <p>
                    Based in Orlando, Florida, Diego brings a builder's mentality and a quality-first discipline to Phaos AI — making sure our platform doesn't just launch, it performs.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tori McCrea */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="rounded-3xl p-8 md:p-12 bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 mb-8"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-48 h-48 rounded-2xl overflow-hidden shrink-0 border-2 border-primary/30">
                <img src={toriPhoto} alt="Tori McCrea — Operations Specialist at Phaos AI" width={192} height={192} loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">Tori McCrea</h3>
                <p className="text-primary font-medium mb-4">Operations Specialist</p>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Tori believes that behind every clean ledger is a foundation of trust that allows mission-driven organizations to thrive. As a Certified Bookkeeper and Executive Administrator with over seven years of experience, she has dedicated her career to the intersection of financial stewardship and strategic leadership support. Her multifaceted background ranges from managing the fast-paced, high-volume demands of restaurant bookkeeping to nearly seven years of dedicated service in ministry administration. Tori serves as a trusted right-hand to executives, specializing in bringing structure to complexity through organized systems, transparent reporting, and improved workflows. Beyond the spreadsheets, she is driven by a genuine commitment to servant leadership, ensuring that every dollar is accounted for so that teams can focus on their true purpose. Tori blends a sharp eye for detail with a friendly, grounded approach, making her an indispensable partner for Phaos AI, having the vision for long-term impact.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Kaitlyn Hathaway */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="rounded-3xl p-8 md:p-12 bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 mb-8"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-48 h-48 rounded-2xl overflow-hidden shrink-0 border-2 border-primary/30">
                <img src={kaitlynPhoto} alt="Kaitlyn Hathaway — Marketing Specialist at Phaos AI" width={192} height={192} loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">Kaitlyn Hathaway</h3>
                <p className="text-primary font-medium mb-4">Marketing Specialist</p>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Kaitlyn brings a uniquely human-centered and data-driven approach to her role as Marketing Specialist at Phaos AI. Her career is defined by a proven ability to build community trust, drive engagement, and translate complex concepts into compelling narratives.
                  </p>
                  <p>
                    At Mh3 Solar, Kaitlyn operated as a Marketing Manager, where she executed strategic, multi-platform campaigns that increased social media following by 600% and consistently generated targeted leads. Her expertise spans digital marketing, public relations, and hands-on content production using tools like Adobe and Canva Pro. Drawing on her Bachelor of Arts in Psychology, she previously served in critical community and healthcare roles at North Star Memorial Group and Kettering Health Network. In these positions, she specialized in building rapport, educating clients on their options, and managing community events and public relations.
                  </p>
                  <p>
                    At Phaos AI, Kaitlyn leverages this rare blend of psychological insight and digital marketing prowess to ensure the firm's brand is both highly visible and deeply authentic. She is responsible for driving lead generation, expanding the company's digital footprint, and crafting the messaging that connects Phaos AI's technical solutions to real-world needs. Based in Edgewater, Florida, Kaitlyn is a highly organized and community-driven professional who brings a collaborative, results-oriented spirit to the team, ensuring the company's outward presence perfectly reflects its core values of faith, fun, family and excellence.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Will Donahue */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="rounded-3xl p-8 md:p-12 bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-48 h-48 rounded-2xl overflow-hidden shrink-0 border-2 border-primary/30">
                <img src={willPhoto} alt="Will Donahue — Sales Specialist at Phaos AI" width={192} height={192} loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">Will Donahue</h3>
                <p className="text-primary font-medium mb-4">Sales Specialist</p>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    With an impressive professional background rooted in the competitive world of commercial real estate and business development—including his time at CBRE, the world's largest commercial real estate services firm—Will has mastered the art of navigating complex, high-stakes transactions. During his tenure in the Mid-Atlantic Brokerage Group, he was instrumental in financial analysis and lead generation for top-tier agency leasing teams.
                  </p>
                  <p>
                    Recognized as a DCA Live Rising Star and an honoree of the Washington Business Journal's Deal of the Year, Will brings a decorated track record of excellence to the Phaos AI team. He excels at identifying high-growth opportunities and simplifying the path from initial engagement to long-term commercial partnership. At Phaos AI, Will leverages his consultative acumen and "people-first" mindset to bridge the gap between technical innovation and real-world business utility, ensuring that every client finds a tailored, high-impact solution for their operational needs.
                  </p>
                  <p>
                    A graduate of Denison University with an M.S. in Real Estate from Georgetown University, Will combines academic rigor with a grounded, humble approach to leadership. He is a "grit-first" professional who views sales as a form of stewardship—protecting the interests of his clients while driving the sustainable growth that allows Phaos AI to scale. When he isn't architecting new partnerships, Will stays active in the community and remains dedicated to the pursuit of excellence in both his professional and personal life, ensuring that Phaos AI is represented through faith, integrity and drive.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to <span className="text-gradient-purple">Join the Journey</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Whether you're a potential partner, investor, or customer — we'd love to connect.
            </p>
            <Link to="/contact" className="inline-flex bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 transition-all text-base items-center gap-2 group">
              Schedule a Call
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
