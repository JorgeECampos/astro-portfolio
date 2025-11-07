import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;
export const runtime = 'node';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

function isValidEmail(e: string) {
  return /\S+@\S+\.\S+/.test(e);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const headers = request.headers;
    const bypass = headers.get('x-dev-bypass');
    const ip =
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headers.get('cf-connecting-ip') ??
      undefined;

    const body = await request.json().catch(() => ({}));
    const {
      name = '',
      email = '',
      message = '',
      token = '',
      action = '',
    } = body as Record<string, any>;

    // Basic validation
    if (!name || !isValidEmail(email) || typeof message !== 'string' || message.trim().length < 5) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid data' }), { status: 400 });
    }

    // Check required envs
    const RECAPTCHA_SECRET = import.meta.env.RECAPTCHA_SECRET;
    const MAIL_TO = import.meta.env.MAIL_TO;
    if (!RECAPTCHA_SECRET || !import.meta.env.RESEND_API_KEY || !MAIL_TO) {
      console.error('Missing envs', { RECAPTCHA_SECRET: !!RECAPTCHA_SECRET, RESEND: !!import.meta.env.RESEND_API_KEY, MAIL_TO: !!MAIL_TO });
      return new Response(JSON.stringify({ ok: false, error: 'Server configuration error' }), { status: 500 });
    }

    // DEV bypass header (only allow when running in dev)
    if (import.meta.env.DEV && bypass === '1') {
      console.warn('⚠️ Bypassing reCAPTCHA (DEV mode) by x-dev-bypass header');
    } else {
      // Ensure token exists
      if (!token) return new Response(JSON.stringify({ ok: false, error: 'Missing captcha token' }), { status: 400 });

      // Verify reCAPTCHA with timeout and fallback
      const VERIFY_URLS = [
        'https://www.google.com/recaptcha/api/siteverify',
        'https://www.recaptcha.net/recaptcha/api/siteverify'
      ];

      let rc: any = null;
      let lastErr: any = null;
      for (const url of VERIFY_URLS) {
        const params = new URLSearchParams({
          secret: RECAPTCHA_SECRET,
          response: token,
        });
        if (ip) params.set('remoteip', ip);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
            signal: controller.signal,
          });
          clearTimeout(timeout);
          const text = await res.text();
          try { rc = JSON.parse(text); } catch { rc = { success: false, parsing_error: text }; }
        } catch (err) {
          clearTimeout(timeout);
          lastErr = err;
          console.warn(`recaptcha fetch error (${url}):`, String(err));
          // try next URL
        }

        if (rc) break;
      }

      if (!rc) {
        console.error('reCAPTCHA verification failed (no response)', { lastErr: String(lastErr) });
        return new Response(JSON.stringify({ ok: false, error: 'Captcha verification error' }), { status: 502 });
      }

      // Log for debugging (remove or reduce in prod)
      if (!rc.success) console.warn('reCAPTCHA response:', rc);

      // checks: success, score threshold, action & hostname if present
      const scoreOk = typeof rc.score === 'number' ? rc.score >= 0.5 : true;
      const actionOk = !action || !rc.action || rc.action === action;
      // optional host check (uncomment and set your domain)
      // const hostOk = !rc.hostname || rc.hostname.endsWith('yourdomain.com');
      const hostOk = true;

      if (!rc.success || !scoreOk || !actionOk || !hostOk) {
        console.error('reCAPTCHA failed checks', { rc });
        return new Response(JSON.stringify({ ok: false, error: 'Captcha failed', details: rc['error-codes'] ?? rc }), { status: 403 });
      }
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: `Portfolio <onboarding@resend.dev>`, // must be allowed in Resend
      to: [MAIL_TO],
      replyTo: email,
      subject: `New message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(JSON.stringify({ ok: false, error: 'Email delivery failed' }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id ?? null }), { status: 200 });
  } catch (e: any) {
    console.error('API error:', e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? 'Server error' }), { status: 500 });
  }
};
