// Public health check endpoint. Returns 200 + minimal status JSON.
// Used by uptime monitors. No auth, no DB writes, no PII.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "phaos-ai",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
