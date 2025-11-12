import { Octokit } from "octokit";
export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    const { policy, section, suggestion, contact, company } = await request.json();
    if (company) return new Response("ok"); // honeypot
    if (!policy || !suggestion) return new Response("Missing fields", { status: 400 });

    const GITHUB_TOKEN  = import.meta.env.GITHUB_TOKEN as string | undefined;
    const GITHUB_OWNER  = import.meta.env.GITHUB_OWNER as string | undefined;
    const GITHUB_REPO   = import.meta.env.GITHUB_REPO as string | undefined;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return new Response(`Missing: ${
        ["GITHUB_TOKEN","GITHUB_OWNER","GITHUB_REPO"].filter(k => !import.meta.env[k as any]).join(", ")
      }`, { status: 500 });
    }

    const octo = new Octokit({ auth: GITHUB_TOKEN });
    const title = `[Docs Suggestion] ${policy}${section ? ` – ${section}` : ""}`;
    const body =
`**Policy:** ${policy}
**Section:** ${section || "—"}
**Suggestion:**
${suggestion}

**Contact:** ${contact || "—"}`;

    const r = await octo.request("POST /repos/{owner}/{repo}/issues", {
      owner: GITHUB_OWNER, repo: GITHUB_REPO, title, body, labels: ["docs","suggestion"]
    });

    // Return the created issue URL so you can verify immediately
    return new Response(JSON.stringify({ url: r.data.html_url, number: r.data.number }), {
      headers: { "Content-Type": "application/json" }, status: 201
    });
  } catch (e: any) {
    return new Response(`Error: ${e?.message || e}`, { status: 500 });
  }
}
