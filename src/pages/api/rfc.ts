import type { APIRoute } from "astro";
import { validateRfc } from "../../lib/rfc";

export const GET: APIRoute = async ({ url }) => {
  const rfc = url.searchParams.get("rfc");

  if (!rfc) {
    return new Response(
      JSON.stringify({ error: "RFC is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const result = validateRfc(rfc);

  return new Response(
    JSON.stringify({ rfc, ...result }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
