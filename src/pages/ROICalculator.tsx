import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ROICalculator from "@/components/ROICalculator";
import { roiCalculatorSchema } from "@/lib/seo-schemas";

const ROICalculatorPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="AI ROI Calculator | Phaos AI"
        description="Calculate your savings from Voice AI agents and Workflow Automation. Free interactive tool to estimate ROI from Phaos AI implementation."
        canonical="/roi-calculator"
        jsonLd={roiCalculatorSchema}
      />
      <Navigation />
      <main id="main-content">
        <div className="pt-24 px-6 max-w-5xl mx-auto">
          <h1 className="sr-only">AI ROI Calculator</h1>
        </div>
        <div className="pt-2">
          <ROICalculator />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ROICalculatorPage;
