import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const publicKey = Deno.env.get('VAPI_PUBLIC_KEY');
  const assistantId = Deno.env.get('VAPI_ASSISTANT_ID');
  if (!publicKey || !assistantId) {
    return new Response(JSON.stringify({ error: 'VAPI not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ publicKey, assistantId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
