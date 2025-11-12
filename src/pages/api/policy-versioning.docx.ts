import { buildPolicyDoc, H2, P, Bulleted, Table2 } from "@/lib/policyDoc";
import { Packer } from "docx";
export const prerender = false;

export async function GET({ url }: { url: URL }) {
  const owner = url.searchParams.get("owner") ?? "TW Team";
  const version = url.searchParams.get("version") ?? "1.0";
  const updated = url.searchParams.get("updated") ?? new Date().toISOString().slice(0,10);

  const extra:any[] = [];
  extra.push(H2("Semver & Change Types"));
  extra.push(Table2(["Change","Docs Version","Examples"], [
    ["Breaking / major IA","MAJOR","1.x → 2.0"],
    ["New feature/section","MINOR","1.3 → 1.4"],
    ["Typos/links/small fixes","PATCH","1.4.1 → 1.4.2"],
  ]));
  extra.push(H2("Branching & Release Rules"));
  extra.push(...Bulleted([
    "release/gX.Y for releases; hotfix/docs-<ticket> for patches.",
    "Each pull request is linked to a ticket and changelog.",
    "Publish under /docs/{X.Y}; keep N-1 for 12 months.",
  ]));
  extra.push(H2("Compatibility Matrix"));
  extra.push(Table2(["Product","Docs Version","Support"], [
    ["App g7.2","Docs 7.2.x","Active"],
    ["App g7.1","Docs 7.1.x","Maintenance"],
    ["App ≤ g7.0","Docs 7.0.x","Deprecated"],
  ]));

  const doc = await buildPolicyDoc({
    title: "Versioning & Branching Policy",
    owner, version, updated,
    body: "Convenciones de versionado y ramas para asegurar trazabilidad y soporte por versión.",
    bullets: [
      "Semver for documentation.",
      "Clear branches: release/* and hotfix/*.",
      "Controlled retention and deprecation.",
    ],
    table: [
      ["Role","Responsibility"],
      ["TW","Updates version and notes"],
      ["TW Lead","Approves releases and support windows"],
    ],
    extra,
  });

  const buf = await Packer.toBuffer(doc);
  return new Response(buf, {
    headers: {
      "Content-Type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition":'attachment; filename="Versioning-Branching-Policy.docx"',
      "Cache-Control":"no-store",
    },
  });
}
