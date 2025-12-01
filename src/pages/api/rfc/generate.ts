import type { APIRoute } from "astro";
import { generateRfc } from "../../../lib/rfc";

export const GET: APIRoute = async ({ url }) => {
  const nombre = url.searchParams.get("nombre") ?? "";
  const apellidoP = url.searchParams.get("apellidoP") ?? "";
  const apellidoM = url.searchParams.get("apellidoM") ?? "";
  const fecha = url.searchParams.get("fecha") ?? ""; // YYYY-MM-DD

  if (!nombre || !apellidoP || !fecha) {
    return new Response(
      JSON.stringify({
        error: "nombre, apellidoP y fecha (YYYY-MM-DD) son obligatorios"
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const result = generateRfc({
      nombre,
      apellidoP,
      apellidoM,
      fechaNacimiento: fecha
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? "Error generando RFC" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
};
