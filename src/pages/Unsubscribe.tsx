import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "used" | "invalid" | "done" | "error">("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: ANON_KEY },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.valid === false && d.reason === "already_unsubscribed") setStatus("used");
        else if (d.valid) setStatus("valid");
        else setStatus("invalid");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const handleConfirm = async () => {
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (data?.success) setStatus("done");
      else if (data?.reason === "already_unsubscribed") setStatus("used");
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-md mx-auto text-center space-y-6">
          {status === "loading" && <p className="text-muted-foreground">Verifying…</p>}
          {status === "valid" && (
            <>
              <h1 className="text-2xl font-bold">Unsubscribe</h1>
              <p className="text-muted-foreground">Click below to unsubscribe from Phaos AI emails.</p>
              <button onClick={handleConfirm} className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-all">
                Confirm Unsubscribe
              </button>
            </>
          )}
          {status === "done" && <p className="text-foreground font-semibold">You have been unsubscribed.</p>}
          {status === "used" && <p className="text-muted-foreground">You are already unsubscribed.</p>}
          {status === "invalid" && <p className="text-destructive">Invalid or expired link.</p>}
          {status === "error" && <p className="text-destructive">Something went wrong. Please try again.</p>}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Unsubscribe;