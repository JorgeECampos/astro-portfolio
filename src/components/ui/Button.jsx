export function Button({ children, variant = "default" }) {
  const base = "rounded-xl px-4 py-2 text-sm font-medium transition";
  const styles = variant === "outline"
    ? "border border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
    : "bg-blue-600 text-white hover:bg-blue-700";
  return <button className={`${base} ${styles}`}>{children}</button>;
}
