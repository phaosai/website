import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { FeatureStatusBadge } from "@/components/phaos";

interface Props {
  pillar: "Aion" | "Sunesis" | "Kyrios" | "Run Simulation";
  tagline: string;
  description: string;
}

const OnePillarPage = ({ pillar, tagline, description }: Props) => {
  const isAction = pillar === "Run Simulation";
  const title = isAction ? `Run Simulation · Phaos Research` : `Phaos ${pillar}`;

  return (
    <>
      <SEOHead
        title={`${title} — Phaos AI`}
        description={description}
        canonical={`/one/${pillar.toLowerCase().replace(/\s+/g, "-")}`}
      />
      <Navigation />
      <main className="min-h-screen bg-background pt-28 pb-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Phaos Research
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-primary">
            {title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl">{tagline}</p>

          <div className="mt-6 flex items-center gap-2">
            <FeatureStatusBadge status="ROADMAP" />
            <span className="text-xs text-muted-foreground">
              Pillar surface — full experience in progress.
            </span>
          </div>

          <section className="mt-12 max-w-3xl space-y-4 text-foreground/85 leading-relaxed">
            <p>{description}</p>
            <p className="text-sm text-muted-foreground">
              Phaos AI is not a registered investment advisor. All outputs are research,
              evidence, and scenario analysis — never recommendations to buy or sell any
              security.
            </p>
          </section>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex bg-gradient-purple text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full glow-purple hover:opacity-90 transition-all"
            >
              Schedule a Call
            </Link>
            <Link
              to="/"
              className="inline-flex border border-border bg-card/60 text-foreground text-sm font-medium px-5 py-2.5 rounded-full hover:bg-card transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OnePillarPage;
