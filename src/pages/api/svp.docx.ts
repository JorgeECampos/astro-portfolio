import {
  Document, Packer, Paragraph, HeadingLevel, TextRun,
  Table, TableRow, TableCell, WidthType, BorderStyle, Header, Footer, AlignmentType
} from "docx";

export const prerender = false;

const H2 = (t:string)=> new Paragraph({ text:t, heading:HeadingLevel.HEADING_2, spacing:{before:200, after:100} });
const P  = (t?:string)=> new Paragraph(t && t.trim() ? t : "N/A");
const Table2 = (heads:string[], rows:string[][])=> new Table({
  width:{ size:100, type:WidthType.PERCENTAGE },
  rows:[
    new TableRow({ children: heads.map(h =>
      new TableCell({ children:[ new Paragraph({ children:[ new TextRun({ text:h, bold:true }) ] }) ] })
    )}),
    ...rows.map(r => new TableRow({ children: r.map(c => new TableCell({ children:[ new Paragraph(c||"") ] })) }))
  ],
});

export async function POST({ request }: { request: Request }) {
  const {
    title = "SWXXXXX Software Verification Plan and Protocol",
    owner = "Software Test",
    version = "Rev 001",
    planId = "PLN-XXXXXX",
    purpose, systemOverview,
    definitions = [],                  // [["Term","Def"], ...]
    references = [],                   // [["Doc No.","Desc","Rev"], ...]
    scope = [],                        // [["Enh/Anom","Feature","Req ID","TC IDs"], ...]
    regression = [],                   // [["Req ID","Feature","TC IDs"], ...]
    tools = [],                        // [["Tool","Version"], ...]
    sampleSize, methodology, types, deviation, anomalies, acceptance, attachments
  } = await request.json().catch(()=> ({}));

  const footer = new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border:{ top:{ color:"2A5DB0", space:1, size:6, style:BorderStyle.SINGLE }},
      children:[ new TextRun({ text:"Software Verification Plan & Protocol", size:20, color:"666666" }) ],
    })],
  });

  const doc = new Document({
    sections: [{
      headers:{ default: new Header({ children:[] }) },
      footers:{ default: footer },
      children: [
        new Paragraph({ text:title, heading:HeadingLevel.HEADING_1, spacing:{ after:200 } }),
        new Paragraph(`Plan: ${planId}   •   ${version}   •   Owner: ${owner}`),

        H2("PURPOSE"), P(purpose),
        H2("SYSTEM OVERVIEW"), P(systemOverview),

        H2("DEFINITIONS AND ACRONYMS"),
        Table2(["Term","Definition"], definitions),

        H2("REFERENCES"),
        Table2(["Document No.","Description","Rev"], references),

        H2("SCOPE — Features to be Tested"),
        Table2(["Enh./Anom. ID","Feature","Requirement ID","Test Case ID(s)"], scope),

        H2("Regression Analysis"),
        Table2(["Requirement ID","Feature Description","Test Case ID(s)"], regression),

        H2("Not in Scope"), P("N/A (provide rationale if any exclusions)"),

        H2("TOOLS AND SAMPLE SIZE"),
        Table2(["Tool","Version"], tools),
        P(sampleSize || "Sample size rationale (e.g., 1 unit if no execution variability)."),

        H2("TEST METHODOLOGY"), P(methodology || "At least one test per SRS requirement; include RTM linkage."),
        H2("Types of Testing"),
        P(types || "Functional, Automation, Integration, Compatibility, Performance, Security, Exploratory"),

        H2("Deviation Strategy"), P(deviation || "Deviations documented in SVR and reviewed with Q/RA."),
        H2("ANOMALY TRACKING"), P(anomalies || "Track failures in Jira; risk-assess fix/defer."),
        H2("ACCEPTANCE CRITERIA"), P(acceptance || "All required tests executed; RTM complete; anomalies assessed."),
        H2("ATTACHMENTS"), P(attachments || "Test Cases/Protocols, Peer Review Records, Trace Sheets."),
      ],
    }],
  });

  const buf = await Packer.toBuffer(doc);
  return new Response(buf, {
    headers:{
      "Content-Type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition":'attachment; filename="SVP-Protocol.docx"',
      "Cache-Control":"no-store",
    }
  });
}
