/**
 * /functions/api/generate.js
 * Cloudflare Pages Function — handles AI plan generation via Groq API.
 * Route: POST /api/generate
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  /* ── CORS headers ── */
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  /* ── Parse body ── */
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { prompt, brief } = body;

  if (!prompt || !brief) {
    return new Response(JSON.stringify({ error: 'Missing required fields: prompt, brief.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  /* ── Validate API key ── */
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'GROQ_API_KEY environment variable is not configured. Set it in Cloudflare Pages → Settings → Environment Variables.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  /* ── Call Groq API ── */
  let groqResponse;
  try {
    groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an elite strength and conditioning coach with deep expertise in program design, periodisation, and athlete-specific coaching. You produce precise, actionable, data-rich training plans formatted as valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.45,
        max_tokens: 3500,
        response_format: { type: 'json_object' },
      }),
    });
  } catch (fetchErr) {
    return new Response(
      JSON.stringify({ error: `Failed to reach Groq API: ${fetchErr.message}` }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  if (!groqResponse.ok) {
    const errText = await groqResponse.text();
    return new Response(
      JSON.stringify({ error: `Groq API error ${groqResponse.status}: ${errText}` }),
      { status: groqResponse.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const groqData = await groqResponse.json();
  const rawContent = groqData?.choices?.[0]?.message?.content;

  if (!rawContent) {
    return new Response(
      JSON.stringify({ error: 'Groq returned an empty response.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  /* ── Parse & validate AI JSON ── */
  let aiPlan;
  try {
    aiPlan = JSON.parse(rawContent);
  } catch {
    // Attempt to strip accidental markdown fences
    const stripped = rawContent.replace(/```json|```/g, '').trim();
    try {
      aiPlan = JSON.parse(stripped);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response as JSON. Raw content logged server-side.', raw: rawContent.slice(0, 500) }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  }

  /* ── Merge deterministic brief with AI enrichment ── */
  const fullPlan = {
    generated_at: new Date().toISOString(),
    brief,
    ai: aiPlan,
  };

  return new Response(JSON.stringify(fullPlan), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
