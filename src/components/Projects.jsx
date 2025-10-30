import { useEffect, useMemo, useState } from 'react';

export default function Projects({ data = [] }) {
  const [items, setItems] = useState(data);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');

  useEffect(() => {
    const url = tag ? `/api/projects.json?tag=${encodeURIComponent(tag)}` : '/api/projects.json';
    fetch(url).then(r=>r.json()).then(setItems);
  }, [tag]);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(p =>
      p.title.toLowerCase().includes(s) ||
      p.summary.toLowerCase().includes(s) ||
      (p.tags||[]).join(' ').toLowerCase().includes(s)
    );
  }, [items, q]);

  return (
    <div>
      <div style={{display:'grid', gap:'0.5rem', gridTemplateColumns:'1fr 200px'}}>
        <input placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} />
        <select value={tag} onChange={e=>setTag(e.target.value)}>
          <option value="">All tags</option>
          <option>Policies</option>
          <option>SDLC</option>
          <option>Compliance</option>
          <option>API</option>
          <option>SDK</option>
          <option>Docs</option>
          <option>QA</option>
          <option>Validation</option>
          <option>Testing</option>
        </select>
      </div>
      <div className="grid" style={{marginTop:'1rem'}}>
        {filtered.map((p, i) => (
          <article key={i} className="card">
            <h3>{p.title}</h3>
            <p>{p.summary}</p>
            <div>{(p.tags||[]).map((t, j) => <span key={j} className="badge">{t}</span>)}</div>
            <div style={{marginTop:'.5rem'}}>
              {(p.links||[]).map((l, j) => <a key={j} href={l.url} style={{marginRight:'.5rem'}}>{l.label}</a>)}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}