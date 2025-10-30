import { motion } from "framer-motion";

export default function Hero({ headline, summary, links }) {
  return (
    <section className="min-h-[50vh] flex flex-col items-center text-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-12 rounded-3xl shadow-2xl">
      <motion.img
        src="/images/profile.jpg" alt="Profile"
        className="w-36 h-36 rounded-full ring-4 ring-white/70 shadow-xl mb-6"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      />
      <motion.h1
        className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1, duration: .6 }}
      >
        {headline}
      </motion.h1>
      <motion.p
        className="max-w-2xl text-lg opacity-90 leading-relaxed"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2, duration: .6 }}
      >
        {summary}
      </motion.p>
      <motion.div className="mt-8 flex flex-wrap justify-center gap-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .35, duration: .5 }}>
        {links.map((l, i) => (
  <a
    key={i}
    href={l.url}
    target="_blank"
    rel="noopener noreferrer"
    className="px-6 py-3 bg-white text-indigo-700 rounded-full font-semibold hover:bg-indigo-100 transition duration-300 shadow-lg mr-3 last:mr-0"
  >
    {l.label}
  </a>
))}

      </motion.div>
    </section>
  );
}
