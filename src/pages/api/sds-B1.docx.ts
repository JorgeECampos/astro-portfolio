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

async function buildSDS(payload: any) {
  const {
    title = "B1 Software Design Specification",
    owner = "Engineering",
    version = "Rev 001",
    sdsId = "SDS-B1",

    purpose,
    scopeText,
    references = [],
    definitions = [],
    overview,

    designIntro,
    designSections = [], 
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
            text: "Software Design Specification",
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
          H1(title),
          new Paragraph(`${sdsId}   •   ${version}   •   Owner: ${owner}`),

          H2("1 PURPOSE"),
          P(purpose),

          H2("2 SCOPE"),
          P(scopeText),

          H2("3 REFERENCES"),
          Table2(["Document No.", "Description", "Rev"], references),

          H2("4 DEFINITIONS"),
          Table2(["Term", "Definition"], definitions),

          H2("5 OVERVIEW"),
          P(overview),

          H2("6 DESIGN"),
          P(designIntro || "This section describes modules, interfaces, and internal behaviors."),
          Table2(["Module / Area", "Design Description"], designSections),

          H2("7 ATTACHMENTS"),
          P(attachmentsText || "SRS–SDS trace worksheet, sequence diagrams, etc."),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export async function GET() {
  const buf = await buildSDS({});
  return new Response(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="SDS-B1.docx"',
      "Cache-Control": "no-store",
    },
  });
}

export async function POST({ request }: { request: Request }) {
  const payload = await request.json().catch(() => ({}));
  const buf = await buildSDS(payload);
  return new Response(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="SDS-B1.docx"',
      "Cache-Control": "no-store",
    },
  });
}