import { buildPolicyDoc, H2, P, Bulleted, Table2 } from "@/lib/policyDoc";
import { Packer } from "docx";
export const prerender = false;

export async function GET({ url }: { url: URL }) {
  try {
    const owner = url.searchParams.get("owner") ?? "TW Team";
    const version = url.searchParams.get("version") ?? "1.0";
    const updated = url.searchParams.get("updated") ?? new Date().toISOString().slice(0,10);

    const extra = [
      H2("Pre-Publish Checklist"),
      ...Bulleted([
        "Style (Microsoft WSG), approved terminology.",
        "Diagrams: readable fonts, version, legend.",
        "Links 200 OK; valid anchors.",
        "Executable code samples; SDK versions cited.",
        "Accessibility: headings, alt-text, contrast ≥ 4.5:1."
      ]),
      H2("Severities & Handling"),
      Table2(["Severity","Definition","Action"], [
        ["Must-Fix","Factual/security error","Blocks publish"],
        ["High","High clarity impact","Fix in release"],
        ["Medium","Recommended improvement","Plan next PR"],
        ["Low","Nits/style","Batch later"]
      ]),
      H2("Evidence & Audit"),
      ...Bulleted([
        "Peer review & SME attached to PR.",
        "RTM updated when SRS is affected.",
        "Findings logged and resolved in ticket."
      ]),
      H2("Post-Publish Monitoring"),
      ...Bulleted([
        "Nightly link checker; failures → auto ticket.",
        "KPIs: broken links = 0; fix time ≤ 2 business days."
      ]),
    ];

    const doc = await buildPolicyDoc({
      title: "Documentation QA Policy",
      owner, version, updated,
      body: "Defines pre-publish checks, severities, evidence, and monitoring.",
      bullets: [
        "QA is mandatory before publishing.",
        "All findings must be traceable to tickets."
      ],
      table: [
        ["Role","Responsibility"],
        ["QA/Peer","Checklist and technical verification"],
        ["TW Lead","Final approval with evidence"]
      ],
      extra,
    });

    const buf = await Packer.toBuffer(doc);
    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="Documentation-QA-Policy.docx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return new Response(`QA endpoint error: ${err?.message || err}`, { status: 500 });
  }
}
