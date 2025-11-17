import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  AlignmentType,
} from "docx";

export const prerender = false;

const H1 = (t: string) =>
  new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { after: 200 } });

const H2 = (t: string) =>
  new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });

const P = (t?: string) =>
  new Paragraph(t && t.trim() ? t : "N/A");

const Table2 = (heads: string[], rows: string[][]) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: heads.map((h) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: h, bold: true })],
              }),
            ],
          })
        ),
      }),
      ...(rows || []).map((r) =>
        new TableRow({
          children: r.map((c) =>
            new TableCell({
              children: [new Paragraph(c || "")],
            })
          ),
        })
      ),
    ],
  });

async function buildDoc(payload: any) {
  const {
    title = "A1 System Architecture Document",
    owner = "Engineering",
    version = "Rev 001",
    projectCode = "SAD-A1",

    scopeText,
    references = [],
    acronyms = [],

    role,
    intendedUsers,
    intendedPopulation,
    analysisMethodology,
    aiUsage,

    hwPlatforms,
    swPlatforms,
    otsSummary,
    finalVersion,

    inputs,
    outputs,
    workflow,
    interoperability,

    featureList = [],

    infraText,
    archOverview,
    integrationArch,
    processWorkflow,

    directSoupIntro,
    directSoup = [],
    externalSoupIntro,
    externalSoup = [],

    attachmentsText,
  } = payload || {};

  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          top: { color: "2A5DB0", space: 1, size: 6, style: BorderStyle.SINGLE },
        },
        children: [
          new TextRun({
            text: "System Architecture Document",
            size: 20,
            color: "666666",
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        headers: { default: new Header({ children: [] }) },
        footers: { default: footer },
        children: [
          // TITLE
          H1(title),
          new Paragraph(`${projectCode}   •   ${version}   •   Owner: ${owner}`),

          // 1 SCOPE
          H2("1 SCOPE"),
          P(scopeText),

          H2("1.1 References"),
          Table2(["Document No.", "Description", "Rev"], references),

          H2("1.2 Acronyms & Definitions"),
          Table2(["Term", "Definition"], acronyms),

          // 2 SOFTWARE DESCRIPTION
          H2("2 SOFTWARE DESCRIPTION"),

          H2("2.1 Software Operation"),
          H2("2.1.1 Role of the Software"),
          P(role),
          H2("2.1.2 Intended Users"),
          P(intendedUsers),
          H2("2.1.3 Intended User Population"),
          P(intendedPopulation),
          H2("2.1.4 Analysis Methodology"),
          P(analysisMethodology),
          H2("2.1.5 AI/ML Usage"),
          P(aiUsage),

          H2("2.2 Software Specifics"),
          H2("2.2.1 Hardware and Software Platforms"),
          P(hwPlatforms),
          P(swPlatforms),

          H2("2.2.2 Off-the-Shelf (OTS) Software"),
          P(otsSummary),

          H2("2.2.3 Final Release Version"),
          P(finalVersion),

          H2("2.3 Software Inputs and Outputs"),
          H2("2.3.1 Inputs, Outputs, and Formats"),
          P(`Inputs: ${inputs || "N/A"}`),
          P(`Outputs: ${outputs || "N/A"}`),

          H2("2.3.2 Software Workflow and Dataflow"),
          P(workflow),

          H2("2.3.3 Interoperable System Design"),
          P(interoperability),

          H2("2.4 Feature List"),
          ...(featureList.length
            ? featureList.map((f: string) => new Paragraph(`• ${f}`))
            : [P("N/A")]),

          H2("2.5 Software and Infrastructure"),
          P(infraText),

          // 3 SOFTWARE ARCHITECTURE
          H2("3 SOFTWARE ARCHITECTURE"),
          P(archOverview),

          H2("3.1 Software Integration Architecture"),
          P(integrationArch),

          H2("3.2 Software Process Workflow"),
          P(processWorkflow),

          H2("3.3 SOUP / OTS Software"),
          P(directSoupIntro || "Direct SOUP/OTS used in this product are listed below."),

          H2("3.3.1 Direct SOUP / OTS List"),
          Table2(["Title", "Supplier", "Purpose / Usage"], directSoup),

          H2("3.3.2 External SOUP / OTS List"),
          P(externalSoupIntro || "External SOUP/OTS required for operation are listed below."),
          Table2(["Title", "Supplier", "Purpose / Usage"], externalSoup),

          // 4 ATTACHMENTS
          H2("4 ATTACHMENTS"),
          P(attachmentsText || "Architecture diagrams, deployment diagrams, dependency lists, etc."),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}


export async function POST({ request }: { request: Request }) {
  const payload = await request.json().catch(() => ({}));
  const buf = await buildDoc(payload);
  return new Response(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="SAD-A1.docx"',
      "Cache-Control": "no-store",
    },
  });
}


export async function GET() {
  const buf = await buildDoc({});
  return new Response(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="SAD-A1.docx"',
      "Cache-Control": "no-store",
    },
  });
}
