// Terminal Prop · almacén compartido del Registro (Cloudflare Worker + D1 «terminal-prop»).
// Un único documento («registro») que leen y escriben todos los que abren la web. Sin usuarios:
// Javi decidió (04-nov-2026) que los datos no son sensibles y que basta con tener el enlace.
// Cada guardado lleva la revisión que conocía el navegador; si otro guardó antes, se responde 409
// con lo último y la web junta los cambios y vuelve a guardar. Se guardan las 500 últimas versiones.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};
const MAX_BYTES = 2_000_000;
const HISTORIAL = 500;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function leer(env) {
  const row = await env.DB.prepare("SELECT rev, data, updated_at FROM docs WHERE id = 'registro'").first();
  return row ? { rev: row.rev, data: JSON.parse(row.data), updated_at: row.updated_at } : { rev: 0, data: null };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (url.pathname !== "/registro") return json({ error: "no existe" }, 404);

    if (req.method === "GET") return json(await leer(env));

    if (req.method === "PUT") {
      const text = await req.text();
      if (text.length > MAX_BYTES) return json({ error: "demasiado grande" }, 413);
      let p;
      try { p = JSON.parse(text); } catch { return json({ error: "no es JSON" }, 400); }
      if (typeof p.rev !== "number" || !p.data || !Array.isArray(p.data.accounts)) return json({ error: "formato" }, 400);

      const now = new Date().toISOString();
      const data = JSON.stringify(p.data);
      const r = await env.DB.prepare("UPDATE docs SET rev = rev + 1, data = ?, updated_at = ? WHERE id = 'registro' AND rev = ?")
        .bind(data, now, p.rev).run();
      if (!r.meta.changes) return json({ conflict: true, ...(await leer(env)) }, 409);

      await env.DB.batch([
        env.DB.prepare("INSERT INTO history (doc, rev, data, created_at) VALUES ('registro', ?, ?, ?)").bind(p.rev + 1, data, now),
        env.DB.prepare(`DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY id DESC LIMIT ${HISTORIAL})`),
      ]);
      return json({ rev: p.rev + 1, updated_at: now });
    }
    return json({ error: "método no permitido" }, 405);
  },
};
