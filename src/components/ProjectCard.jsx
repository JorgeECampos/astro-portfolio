import { motion } from "framer-motion";

export default function ProjectCard({ p, i }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: i * 0.12 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 hover:scale-105 transition-transform border border-gray-100 dark:border-gray-800"
    >
      <h2 className="text-2xl font-semibold mb-2 text-indigo-600">{p.title}</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-4">{p.summary}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {p.tags.map((t, idx) => (
          <span
            key={idx}
            className="bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm font-medium"
          >
            {t}
          </span>
        ))}
      </div>
      
      {p.links.map((l, idx) => (
          <a
              key={idx}
             href={l.url}
             target="_blank"
             rel="noopener noreferrer"
             className="px-4 py-2 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition mr-3 last:mr-0"
          >
             {l.label}
          </a>
        ))}

    </motion.article>
  );
}
