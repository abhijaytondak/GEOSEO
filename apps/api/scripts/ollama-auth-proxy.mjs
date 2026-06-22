import http from "node:http";
import crypto from "node:crypto";

// Bearer-auth proxy in front of local Ollama. ONLY requests carrying the exact
// secret as `Authorization: Bearer <secret>` reach Ollama — so the tunnel can be
// public without exposing an unauthenticated LLM. The engine (deepseek.ts) already
// sends `Bearer ${DEEPSEEK_API_KEY}`, so set DEEPSEEK_API_KEY = this secret on Render.
const SECRET = process.env.OLLAMA_PROXY_SECRET;
const OLLAMA = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const PORT = Number(process.env.PROXY_PORT) || 11435;
if (!SECRET || SECRET.length < 24) {
  console.error("Set OLLAMA_PROXY_SECRET (>=24 chars)");
  process.exit(1);
}
const secretBuf = Buffer.from(SECRET);
function authOk(header) {
  const tok = (header || "").replace(/^Bearer\s+/i, "");
  if (!tok) return false;
  const a = Buffer.from(tok);
  return a.length === secretBuf.length && crypto.timingSafeEqual(a, secretBuf);
}

const server = http.createServer((req, res) => {
  const send = (code, obj) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(obj));
  };
  if (req.method === "GET" && req.url === "/healthz") return send(200, { ok: true });
  if (!authOk(req.headers["authorization"])) return send(401, { error: "unauthorized" });
  // Only the LLM endpoints — never expose Ollama's admin/model-management routes.
  const allowed = req.url.startsWith("/v1/") || req.url === "/api/tags";
  if (!allowed) return send(403, { error: "forbidden path" });

  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", async () => {
    const body = Buffer.concat(chunks);
    try {
      const upstream = await fetch(OLLAMA + req.url, {
        method: req.method,
        headers: { "content-type": req.headers["content-type"] || "application/json" },
        body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
        signal: AbortSignal.timeout(280_000),
      });
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(upstream.status, { "content-type": upstream.headers.get("content-type") || "application/json" });
      res.end(buf);
    } catch (e) {
      send(502, { error: "ollama unreachable", detail: String(e && e.message ? e.message : e) });
    }
  });
});
// Bind localhost only — the tunnel is the sole public entry, behind the bearer check.
server.listen(PORT, "127.0.0.1", () => console.log(`ollama auth-proxy → ${OLLAMA} on 127.0.0.1:${PORT}`));
