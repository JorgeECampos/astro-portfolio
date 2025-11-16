import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET → traer top 5
export const GET: APIRoute = async () => {
  const { data, error } = await supabase
    .from('scores')
    .select('name, score')
    .order('score', { ascending: false })
    .limit(5);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data ?? []), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

// POST → guardar nuevo score
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { name, score } = body;

  if (!name || typeof name !== 'string' || typeof score !== 'number') {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }

  const cleanName = name.toUpperCase().slice(0, 3);

  const { error } = await supabase
    .from('scores')
    .insert({ name: cleanName, score });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 201 });
};
