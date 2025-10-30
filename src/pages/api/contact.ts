import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return new Response(JSON.stringify({ ok: true, received: body }), {
    headers: { 'content-type': 'application/json' }
  });
};