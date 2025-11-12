import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

export default function SuggestEditButton({ defaultPolicy = "Document Review Policy" }) {
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form) as any);
    const res = await fetch("/api/suggest-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.ok) {
      form.reset();
      dialogRef.current?.close();
      alert("✅ Suggestion submitted!");
    } else {
      alert("❌ Error sending suggestion");
    }
  }

  return (
    <>
      <Button onClick={() => dialogRef.current?.showModal()}>💬 Suggest Edit</Button>
      <dialog ref={dialogRef} className="rounded-xl border p-6 max-w-lg w-full">
        <form method="dialog">
          <button className="float-right text-gray-500">✖</button>
        </form>
        <h2 className="text-lg font-semibold mb-4">Suggest an Edit</h2>
        <form onSubmit={onSubmit} className="grid gap-3">
          <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />
          <label className="grid gap-1 text-sm">
            <span>Policy</span>
            <select name="policy" defaultValue={defaultPolicy} className="rounded-md border px-3 py-2">
              <option>Document Review Policy</option>
              <option>Content Lifecycle Policy</option>
              <option>Versioning & Branching Policy</option>
              <option>Documentation QA Policy</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Section (optional)</span>
            <input name="section" placeholder="e.g., Pre-Publish Checklist" className="rounded-md border px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Suggestion</span>
            <textarea name="suggestion" required rows={5} className="rounded-md border px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Your email (optional)</span>
            <input name="contact" type="email" placeholder="you@example.com" className="rounded-md border px-3 py-2" />
          </label>
          <Button type="submit" disabled={loading}>{loading ? "Sending..." : "Submit"}</Button>
        </form>
      </dialog>
    </>
  );
}
