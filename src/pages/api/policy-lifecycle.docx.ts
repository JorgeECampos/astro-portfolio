import { buildPolicyDoc, H2, P, Bulleted, Table2 } from "@/lib/policyDoc";
import { Packer } from "docx";
export const prerender = false;

export async function GET({ url }: { url: URL }) {
  const owner = url.searchParams.get("owner") ?? "TW Team";
  const version = url.searchParams.get("version") ?? "1.0";
  const updated = url.searchParams.get("updated") ?? new Date().toISOString().slice(0,10);

  const extra:any[] = [];
  extra.push(H2("States & Triggers"));
  extra.push(Table2(["State","Trigger In","Trigger Out"], [
    ["Draft","New/major change","Submitted for Review"],
    ["Review","Author submits","All comments resolved"],
    ["Published","Approved by TW Lead","Archive trigger met"],
    ["Archived","Superseded/obsolete","N/A"],
  ]));
  extra.push(H2("Review Cadence"));
  extra.push(...Bulleted([
    "Major review cada 6 meses; quick checks trimestrales.",
    "Docs >12 months → flag: “Needs Review”.",
  ]));
  extra.push(H2("Archival & Deprecation"));
  extra.push(...Bulleted([
    "Maintain banner visibility for 12 months after deprecation.",
    "Redirects from older versions to the current version.",
  ]));
  extra.push(H2("Metadata & Ownership"));
  extra.push(Table2(["Field","Rule"], [
    ["Owner","Person/role responsable"],
    ["Version","Semver de docs (MAJOR.MINOR.PATCH)"],
    ["Tags","Product, platform, area"],
  ]));

  const doc = await buildPolicyDoc({
    title: "Content Lifecycle Policy",
    owner, version, updated,
    body: "Define states, triggers, revisions, and archiving rules for the document lifecycle.",
    bullets: [
      "Clear states with defined inputs/outputs",
      "Scheduled reviews and automatic obsolescence marking.",
    ],
    table: [
      ["Role","Responsibility"],
      ["TW Lead","Final approval and lifecycle"],
      ["Owner","Keep updated & solve flags"],
    ],
    extra,
  });

  const buf = await Packer.toBuffer(doc);
  return new Response(buf, {
    headers: {
      "Content-Type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition":'attachment; filename="Content-Lifecycle-Policy.docx"',
      "Cache-Control":"no-store",
    },
  });
}
