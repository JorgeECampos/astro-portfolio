import type { APIRoute } from 'astro';
import data from '../../data/projects.json';

export const GET: APIRoute = async ({ request }) => {
  const tag = new URL(request.url).searchParams.get('tag');
  let items = data;
  if (tag) items = data.filter(p => p.tags.includes(tag));
  return new Response(JSON.stringify(items), {
    headers: { 'content-type': 'application/json' }
  });
};