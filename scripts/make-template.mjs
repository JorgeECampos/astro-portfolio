// @ts-nocheck
import {
  Document, Packer, Paragraph, HeadingLevel, Header, Footer,
  TextRun, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle
} from "docx";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { Buffer } from "node:buffer";
import path from "node:path";

const colorPrimary = "2A5DB0";
const colorGray = "666666";

async function main() {
  const headerChildren = [];
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoBuf = await readFile(logoPath);
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new ImageRun({
            data: Buffer.from(logoBuf),
            type: "png",
            transformation: { width: 140, height: 40 }
          }),
        ],
      })
    );
  } catch {}

  const footerEl = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { color: colorPrimary, space: 1, size: 6, style: BorderStyle.SINGLE } },
        spacing: { before: 150 },
        children: [new TextRun({ text: "Documentation Policy Framework", color: colorGray, size: 20 })],
      }),
    ],
  });

  const tableHeaderRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: "Role", bold: true })] })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: "Responsibility", bold: true })] })],
      }),
    ],
  });

  const doc = new Document({
    sections: [{
      headers: { default: new Header({ children: headerChildren }) },
      footers: { default: footerEl },
      children: [
        new Paragraph({ text: "{{TITLE}}", heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
        new Paragraph({ text: "Owner: {{OWNER}}   •   Version: {{VERSION}}   •   Updated: {{UPDATED}}" }),
        new Paragraph({ text: " ", spacing: { after: 200 } }),
        new Paragraph({ text: "Overview", heading: HeadingLevel.HEADING_2 }),
        new Paragraph("This document defines the principles, standards, and workflows for consistent, traceable docs."),
        new Paragraph({ text: " ", spacing: { after: 150 } }),
        new Paragraph({ text: "Policies", heading: HeadingLevel.HEADING_2 }),
        new Paragraph("{{BODY}}"),
        new Paragraph({ text: " ", spacing: { after: 150 } }),
        new Paragraph({ text: "Roles and Review Cadence", heading: HeadingLevel.HEADING_2 }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            tableHeaderRow,
            new TableRow({ children: [new TableCell({ children: [new Paragraph("Technical Writer (TW)")]}), new TableCell({ children: [new Paragraph("Drafts & maintains docs")]}), ]}),
            new TableRow({ children: [new TableCell({ children: [new Paragraph("Peer Reviewer")]}), new TableCell({ children: [new Paragraph("Clarity, tone, grammar")]}), ]}),
            new TableRow({ children: [new TableCell({ children: [new Paragraph("SME")]}), new TableCell({ children: [new Paragraph("Technical accuracy")]}), ]}),
            new TableRow({ children: [new TableCell({ children: [new Paragraph("TW Lead / Owner")]}), new TableCell({ children: [new Paragraph("Final approval & lifecycle")]}), ]}),
          ],
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outDir = path.join(process.cwd(), "public", "templates");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "policies-template.docx");
  await writeFile(outPath, buffer);
  console.log("✅ Plantilla creada:", outPath);
}

main().catch(console.error);
