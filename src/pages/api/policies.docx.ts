import { buildPolicyDoc, H2, P, Bulleted, Table2 } from "@/lib/policyDoc";
import { Packer } from "docx";

export const prerender = false;

export async function GET({ url }: { url: URL }) {
  const title   = url.searchParams.get("title")   ?? "Document Review Policy";
  const owner   = url.searchParams.get("owner")   ?? "TW Team";
  const version = url.searchParams.get("version") ?? "1.0";
  const updated = url.searchParams.get("updated") ?? new Date().toISOString().slice(0,10);
  const body    = url.searchParams.get("body")    ?? "Policy to ensure accuracy, clarity, traceability and compliance.";

  // Contenido “rico” según el título
  const extra = [];

  // SECCIÓN: Objetivos
  extra.push(H2("Objectives"));
  extra.push(P("Establish a predictable review system that ensures technical accuracy, consistency with product state, and audit readiness."));

  // RACI
  extra.push(H2("RACI — Roles & Responsibilities"));
  extra.push(Table2(
    ["Role","Responsible","Accountable","Consulted","Informed"],
    [
      ["Technical Writer (TW)","Drafts, resolves comments","TW Lead","SME, QA","PM, Eng Lead"],
      ["SME","Validates technical content","Eng Manager","TW, QA","TW Lead, Compliance"],
      ["Peer Reviewer","Clarity, style, links","TW Lead","TW","SME"],
      ["TW Lead","Final approval, lifecycle","TW Lead","SME, QA, PM","Leadership"],
    ]
  ));

  // Workflow
  extra.push(H2("Review Workflow"));
  extra.push(P("Draft → Peer Review → SME Validation → Final Approval → Publish → Post-Publish QA."));
  extra.push(...Bulleted([
    "Comments tracked on GitHub/ClickUp; no changes outside the system.",
    "SLAs: Peer Review ≤ 3 business days; SME ≤ 5 business days.",
    "Posting will be blocked if there are open 'Must-Fix' comments.",
  ]));

  // Versioning
  extra.push(H2("Versioning & Change Control"));
  extra.push(...Bulleted([
    "Branch format: release/gX.Y; hotfix/docs-<ticket>.",
    "Semver de docs: MAJOR por cambios disruptivos, MINOR por features, PATCH por typos.",
    "Every change linked to ticket; include change note en front-matter.",
  ]));

  // RTM
  extra.push(H2("Traceability (RTM)"));
  extra.push(Table2(["Requirement ID","Doc Section","Verification Artifact"], [
    ["SRS-1.2","Login/MFA","TC-045, TC-046"],
    ["SRS-3.4","Data Export","TC-200..210"],
  ]));

  // QA Checklist
  extra.push(H2("Pre-Publish QA Checklist"));
  extra.push(...Bulleted([
    "Grammar/style: Microsoft WSG; banned terms validated.",
    "Diagrams: legible fonts, product version, legend.",
    "Links: 200 OK; valid anchors.",
    "Code: compileable/executable; SDK versions cited.",
    "Accessibility: orderly headings, alt-text in images, contrast ≥ 4.5:1.",
  ]));

  // Metrics
  extra.push(H2("Metrics & SLAs"));
  extra.push(Table2(["KPI","Target"], [
    ["Lead time from draft to publish","≤ 10 días hábiles"],
    ["Peer review turnaround","≤ 3 días hábiles"],
    ["Broken links after publish","0"],
  ]));

  // Governance
  extra.push(H2("Governance & Exceptions"));
  extra.push(...Bulleted([
    "Exceptions only in writing by TW Lead; document in exception log.",
    "Archived documents retain a deprecation banner for 12 months.",
  ]));

  const doc = await buildPolicyDoc({
    title, owner, version, updated,
    body,
    bullets: [
      "At least one peer review and one SME validation required.",
      "Comments resolved in GitHub or ClickUp.",
      "Final approval by TW Lead.",
    ],
    // Cabecera de tabla + filas (el builder espera [headers, ...rows])
    table: [
      ["Role","Responsibility"],
      ["Technical Writer (TW)","Drafts & maintains docs"],
      ["Peer Reviewer","Clarity, tone, grammar"],
      ["SME","Technical accuracy"],
    ],
    extra,
  });

  const buf = await Packer.toBuffer(doc);
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="Document-Review-Policy.docx"',
      "Cache-Control": "no-store",
    },
  });
}
