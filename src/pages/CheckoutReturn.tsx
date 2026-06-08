import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (!sessionId) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [sessionId]);

  return (
    <>
      <SEOHead title="Purchase Complete | Phaos AI" description="Thank you for your Phaos AI purchase. Your order has been received and your workspace access is being provisioned." canonical="/checkout/return" noIndex />
      <Navigation />
      <main className="min-h-[70vh] flex items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full text-center">
          {sessionId ? (
            <>
              <div className="mx-auto w-14 h-14 rounded-full bg-purple-deep/15 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-7 h-7 text-purple-deep" />
              </div>
              <h1 className="text-3xl font-semibold text-foreground">Purchase complete</h1>
              <p className="mt-3 text-muted-foreground">
                We've sent a confirmation to your email. Your access is being provisioned now.
              </p>
              <p className="mt-6 text-xs text-muted-foreground/70 break-all">
                Session: {sessionId}
              </p>
              <Link
                to="/app"
                className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium bg-purple-deep text-white hover:bg-purple-deep/90"
              >
                Go to your workspace <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-foreground">No session found</h1>
              <p className="mt-3 text-muted-foreground">
                We couldn't find a checkout session. If you completed a payment, check your email
                for a receipt.
              </p>
              <Link
                to="/pricing"
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium bg-foreground/10 text-foreground hover:bg-foreground/15"
              >
                Back to pricing
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
