export function Card({ children, className }) {
  return <div className={`rounded-2xl shadow border p-6 ${className}`}>{children}</div>;
}

export function CardHeader({ children }) {
  return <div className="mb-2 flex items-center gap-2">{children}</div>;
}

export function CardTitle({ children }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function CardContent({ children }) {
  return <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">{children}</div>;
}