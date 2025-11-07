import type { APIRoute } from 'astro';
import { Resend } from 'resend';
export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name = '', email = '', message = '', token = '' } = await request.json();

    // Validación básica
    if (!name || !/\S+@\S+\.\S+/.test(email) || message.trim().length < 10) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid data' }), { status: 400 });
    }

    // 1) Verificar reCAPTCHA v3
    const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${import.meta.env.RECAPTCHA_SECRET}&response=${encodeURIComponent(token)}`,
    });
    const rc = await verify.json();
    if (!rc.success || (typeof rc.score === 'number' && rc.score < 0.5)) {
      return new Response(JSON.stringify({ ok: false, error: 'Captcha failed' }), { status: 403 });
    }

    // 2) Enviar email con Resend
    const { data, error } = await resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>',     
      to: [import.meta.env.MAIL_TO!],
      replyTo: email,
      subject: `New message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id }), { status: 200 });

  } catch (e: any) {
    console.error('API error:', e);
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Server error' }), { status: 500 });
  }
};
