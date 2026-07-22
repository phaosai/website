import { Link } from "react-router-dom";
import { Mic, Workflow, LineChart, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const PORTALS = [
  {
    key: "voice",
    title: "Voice",
    desc: "Sign in to your voice.phaosai.com agent console.",
    href: "https://voice.phaosai.com/auth",
    external: true,
    icon: Mic,
  },
  {
    key: "workflow",
    title: "Workflow",
    desc: "Sign in to manage your agentic workflow automations.",
    href: "/auth?portal=workflow",
    external: false,
    icon: Workflow,
  },
  {
    key: "research",
    title: "Research",
    desc: "Sign in to Sunesis — Phaos' research operating system.",
    href: "/auth?portal=research",
    external: false,
    icon: LineChart,
  },
];

export default function SignIn() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Sign In — Phaos AI"
        description="Sign in to your Phaos AI Voice, Workflow, or Research account."
        canonical="/signin"
      />
      <Navigation />
      <main id="main-content" className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Sign in to <span className="text-gradient-purple">Phaos</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose which Phaos product you'd like to access.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {PORTALS.map(({ key, title, desc, href, external, icon: Icon }) => {
              const cls =
                "group rounded-2xl border border-border bg-card/60 p-7 hover:border-primary/40 hover:bg-card transition-all hover:-translate-y-0.5";
              const inner = (
                <>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{title}</h2>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    Sign in
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </>
              );
              return external ? (
                <a key={key} href={href} className={cls} target="_blank" rel="noreferrer">
                  {inner}
                </a>
              ) : (
                <Link key={key} to={href} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Don't have an account? <Link to="/contact" className="text-primary hover:underline">Schedule a Call</Link> to get started.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
