import {
  Document, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType,
  BorderStyle, Footer, Header, AlignmentType,
  PageNumber, convertInchesToTwip, ImageRun
} from "docx";
import { readFileSync } from "node:fs";
import path from "node:path";

export type PolicyInput = {
  title: string;
  owner: string;
  version: string;
  updated: string;
  body?: string;
  bullets?: string[];
  table?: string[][];
  extra?: Array<Paragraph | Table>; 
};

// Helpers públicos para reutilizar en endpoints
export const H2 = (t: string) =>
  new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });

export const P = (t?: string) => new Paragraph(t && t.trim() ? t : "N/A");

export const Bulleted = (items: string[]) =>
  items.map((it) => new Paragraph({ text: it, bullet: { level: 0 }, spacing: { before: 40, after: 40 } }));

export const Table2 = (heads: string[], rows: string[][]) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: heads.map((h) =>
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })
        ),
      }),
      ...rows.map((r) =>
        new TableRow({
          children: r.map((c) => new TableCell({ children: [new Paragraph(c || "")] })),
        })
      ),
    ],
  });

export async function buildPolicyDoc(p: PolicyInput) {
  
  let logoBuffer: Buffer | undefined;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    logoBuffer = readFileSync(logoPath);
  } catch {}

  const header = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: logoBuffer ? [new ImageRun({ data: logoBuffer, transformation: { width: 120, height: 40 } })] : [],
      }),
    ],
  });

  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { color: "2A5DB0", space: 1, size: 6, style: BorderStyle.SINGLE } },
        children: [
          new TextRun({ text: "Documentation Policy Framework  ", color: "666666", size: 20 }),
          new TextRun({ children: ["•  Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], color: "666666", size: 20 }),
        ],
      }),
    ],
  });

  const children: Array<Paragraph | Table> = [
    new Paragraph({ text: p.title, heading: HeadingLevel.TITLE, spacing: { after: 200 } }),
    new Paragraph({ text: `Owner: ${p.owner}   •   Version: ${p.version}   •   Updated: ${p.updated}`, spacing: { after: 200 } }),
    new Paragraph({ text: "Policy Overview", heading: HeadingLevel.HEADING_2 }),
  ];

  if (p.body) children.push(new Paragraph(p.body));
  if (p.bullets?.length) children.push(...Bulleted(p.bullets));
  if (p.table?.length) {
    children.push(new Paragraph({ text: " " }));
    children.push(Table2(p.table[0], p.table.slice(1))); 
  }
  if (p.extra?.length) children.push(...p.extra);        

  return new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: "222222" }, paragraph: { spacing: { line: 276, before: 60, after: 60 } } },
      },
      paragraphStyles: [
        { id: "Title", name: "Title", basedOn: "Normal", run: { size: 36, bold: true, color: "1F2937" }, paragraph: { spacing: { after: 200 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", run: { size: 26, bold: true, color: "1F2937" }, paragraph: { spacing: { before: 200, after: 100 } } },
      ],
      table: { borderSize: 4, borderColor: "DDDDDD" },
    },
    sections: [
      {
        headers: { default: header },
        footers: { default: footer },
        properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1), right: convertInchesToTwip(1) } } },
        children,
      },
    ],
  });
}
