import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog')).filter(p => !p.data.draft);
  return rss({
    title: 'Jorge Campos — Blog',
    description: 'SDLC, Docs, DevEx',
    site: context.site,
    items: posts.map(p => ({
      title: p.data.title,
      description: p.data.summary,
      link: `/blog/${p.slug}`,
      pubDate: p.data.pubDate,
    })),
  });
}
