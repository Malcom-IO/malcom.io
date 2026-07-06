/**
 * Cloudflare Worker for the malcom.io contact form.
 *
 * Flow: receive the form POST -> verify the Cloudflare Turnstile token ->
 * email the submission via Resend -> return JSON. No secrets live in this file;
 * TURNSTILE_SECRET and RESEND_API_KEY are set as Worker secrets in Cloudflare
 * (`wrangler secret put ...`) and injected at runtime as `env.*`.
 */

const ALLOWED_ORIGINS = ['https://www.malcom.io', 'https://malcom.io'];

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }
    if (request.method !== 'POST') {
      return json(request, { error: 'Method not allowed' }, 405);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return json(request, { error: 'Invalid request' }, 400);
    }

    const { name, email, subject, body, token, website } = data;

    // Honeypot: bots fill the hidden "website" field. Pretend success, drop it.
    if (website) return json(request, { success: true });

    if (!name || !email || !body) {
      return json(request, { error: 'Please fill in your name, email, and message.' }, 400);
    }

    // 1) Verify the Turnstile token server-side.
    const verify = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: token || '',
          remoteip: request.headers.get('CF-Connecting-IP') || '',
        }),
      },
    ).then((r) => r.json());

    if (!verify.success) {
      return json(request, { error: 'Spam check failed — please try again.' }, 400);
    }

    // 2) Send the email via Resend.
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM, // e.g. "Malcom IO <contact@malcom.io>"
        to: env.MAIL_TO, // e.g. "marcus@malcom.io"
        reply_to: email,
        subject: `[malcom.io] ${subject || 'New contact message'}`,
        text: `From: ${name} <${email}>\n\n${body}`,
      }),
    });

    if (!sent.ok) {
      return json(request, { error: 'Could not send your message. Please try again later.' }, 502);
    }

    return json(request, { success: true });
  },
};

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(request, obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  });
}
