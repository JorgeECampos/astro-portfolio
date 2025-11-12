import JSZip from "jszip";
import { Packer } from "docx";
import { buildPolicyDoc, H2, P, Bulleted, Table2 } from "@/lib/policyDoc";

export const prerender = false;

export async function GET() {
  const owner = "TW Team";
  const version = "1.0";
  const updated = new Date().toISOString().slice(0, 10);

  // --- 1) Document Review Policy ---
  const review = await buildPolicyDoc({
    title: "Document Review Policy",
    owner, version, updated,
    body: "Ensures accuracy, clarity, traceability, and audit readiness.",
    bullets: [
      "At least one peer review and one SME validation.",
      "All comments tracked and resolved in GitHub/ClickUp.",
      "Final approval by TW Lead prior to publish."
    ],
    table: [
      ["Role","Responsibility"],
      ["Technical Writer (TW)","Drafts & maintains docs"],
      ["Peer Reviewer","Clarity, tone, links"],
      ["SME","Technical accuracy"]
    ],
    extra: [
      H2("Objectives"),
      P("Establish a predictable review process aligned with product state."),
      H2("RACI"),
      Table2(["Role","R","A","C","I"], [
        ["TW","✓","—","SME, QA","PM"],
        ["SME","✓","Eng Mgr","TW","TW Lead"],
        ["TW Lead","—","✓","SME, QA, PM","Leadership"]
      ]),
      H2("Workflow"),
      P("Draft → Peer Review → SME Validation → Final Approval → Publish → Post-Publish QA.")
    ]
  });

  // --- 2) Content Lifecycle Policy ---
  const lifecycle = await buildPolicyDoc({
    title: "Content Lifecycle Policy",
    owner, version, updated,
    body: "Defines states, triggers, reviews, and archival rules.",
    bullets: ["Clear entry/exit for each state.", "Automatic staleness flags over 12 months."],
    table: [
      ["Role","Responsibility"],
      ["TW Lead","Final approval and lifecycle governance"],
      ["Owner","Keep content current; resolve flags"]
    ],
    extra: [
      H2("States & Triggers"),
      Table2(["State","Trigger In","Trigger Out"], [
        ["Draft","New/major change","Submitted for Review"],
        ["Review","Author submission","All comments resolved"],
        ["Published","TW Lead approval","Archive trigger met"],
        ["Archived","Superseded/obsolete","N/A"]
      ])
    ]
  });

  // --- 3) Versioning & Branching Policy ---
  const versioning = await buildPolicyDoc({
    title: "Versioning & Branching Policy",
    owner, version, updated,
    body: "Standardizes SemVer and branching rules for docs.",
    bullets: ["SemVer for docs.", "release/* and hotfix/* branches.", "Keep N−1 versions live for 12 months."],
    table: [
      ["Role","Responsibility"],
      ["TW","Update version and changelog"],
      ["TW Lead","Approve release windows"]
    ],
    extra: [
      H2("SemVer & Change Types"),
      Table2(["Change","Docs Version","Example"], [
        ["Breaking IA","MAJOR","1.x → 2.0"],
        ["New feature","MINOR","1.3 → 1.4"],
        ["Typos/links","PATCH","1.4.1 → 1.4.2"]
      ])
    ]
  });

  // --- 4) Documentation QA Policy ---
  const qa = await buildPolicyDoc({
    title: "Documentation QA Policy",
    owner, version, updated,
    body: "Defines pre-publish checks, severities, evidence, and monitoring.",
    bullets: ["QA is mandatory before publishing.", "Findings must be traceable to tickets."],
    table: [
      ["Role","Responsibility"],
      ["QA/Peer","Checklist and technical verification"],
      ["TW Lead","Final approval with evidence"]
    ],
    extra: [
      H2("Pre-Publish Checklist"),
      Bulleted([
        "Style (Microsoft WSG), approved terminology.",
        "Diagrams: readable fonts, version, legend.",
        "Links 200 OK; valid anchors.",
        "Executable code samples; SDK versions cited.",
        "Accessibility: headings, alt-text, contrast ≥ 4.5:1."
      ]),
      H2("Severities"),
      Table2(["Severity","Definition","Action"], [
        ["Must-Fix","Factual/security error","Blocks publish"],
        ["High","High clarity impact","Fix in release"],
        ["Medium","Recommended improvement","Plan next PR"],
        ["Low","Nits/style","Batch later"]
      ])
    ]
  });

  const zip = new JSZip();
  zip.file("Document Review Policy.docx", await Packer.toBuffer(review));
  zip.file("Content Lifecycle Policy.docx", await Packer.toBuffer(lifecycle));
  zip.file("Versioning & Branching Policy.docx", await Packer.toBuffer(versioning));
  zip.file("Documentation QA Policy.docx", await Packer.toBuffer(qa));

  const zipBuf = await zip.generateAsync({ type: "nodebuffer" });
  return new Response(zipBuf, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="Policies.zip"',
      "Cache-Control": "no-store"
    }
  });
}
