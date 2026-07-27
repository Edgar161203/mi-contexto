// S08 OpenClaw: ensambla las 4 piezas en una sola corrida.
// Memoria (Mem0 + archivos de contexto) -> Herramienta (mi-herramienta vía MCP de Supabase)
// -> Gemini redacta el mensaje -> Canal de salida (Gmail, se lo manda a Edgar mismo)
// -> Registro de ejecución en memory/log.md

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { readFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MEM0_API_KEY = process.env.MEM0_API_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const SUPABASE_PROJECT_REF = "eccpmhaiowuiiojatidr";
const MEM0_USER_ID = "edgar";

// --- Memoria: archivos de contexto + Mem0 ---
function leerContexto() {
  const archivos = ["quien-soy.md", "que-hago.md", "en-que-estoy.md"];
  return archivos.map((f) => `--- ${f} ---\n${readFileSync(f, "utf8")}`).join("\n\n");
}

async function recallMem0(query) {
  const res = await fetch("https://api.mem0.ai/v1/memories/search/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Token ${MEM0_API_KEY}` },
    body: JSON.stringify({ query, user_id: MEM0_USER_ID }),
  });
  if (!res.ok) throw new Error(`Mem0 respondió ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.slice(0, 5).map((m) => m.memory).join("\n") || "(sin recuerdos relevantes)";
}

// --- Herramienta real: estado de mi-herramienta vía MCP de Supabase ---
async function estadoMiHerramienta() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@supabase/mcp-server-supabase", `--project-ref=${SUPABASE_PROJECT_REF}`, "--read-only"],
    env: { SUPABASE_ACCESS_TOKEN: SUPABASE_ACCESS_TOKEN ?? "" },
  });
  const client = new Client({ name: "openclaw", version: "1.0.0" });
  await client.connect(transport);
  const result = await client.callTool({ name: "list_edge_functions", arguments: {} });
  const parsed = JSON.parse(result.content[0].text);
  await client.close();
  if (parsed.error) throw new Error(parsed.error.message);
  const fn = parsed.functions?.find((f) => f.slug === "mi-herramienta");
  return fn ? `mi-herramienta está ${fn.status} (versión ${fn.version})` : "mi-herramienta no aparece listada";
}

// --- Gemini redacta el mensaje final ---
async function redactarMensaje(contexto, recuerdos, estadoHerramienta) {
  const prompt = `Eres el OpenClaw de Edgar, su sistema de IA para el negocio de repuestos y cambio de ` +
    `aceite (negocio de su papá). Con este contexto:\n\n${contexto}\n\n` +
    `Y estos recuerdos guardados en Mem0:\n${recuerdos}\n\n` +
    `Y el estado real (justo ahora, vía MCP de Supabase) de su herramienta: "${estadoHerramienta}"\n\n` +
    `Escribe un correo corto (6-10 líneas) para Edgar, tono cercano y merideño, con:\n` +
    `1) saludo y fecha,\n` +
    `2) el estado real de mi-herramienta,\n` +
    `3) UN recordatorio de una de sus 3 tareas manuales pendientes de automatizar,\n` +
    `4) una frase de ánimo sobre su meta de ser programador.\n` +
    `Responde con dos partes separadas por una línea "---": primero un asunto de una línea, ` +
    `luego el cuerpo del correo. Sin comentarios extra.`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini respondió ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const texto = data.candidates[0].content.parts[0].text.trim();
  const [asunto, ...resto] = texto.split("\n---\n");
  return { asunto: asunto.trim(), cuerpo: resto.join("\n---\n").trim() };
}

// --- Canal de salida: Gmail send ---
async function refrescarAccessToken() {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error("No se pudo refrescar el access token: " + JSON.stringify(data));
  return data.access_token;
}

function base64url(str) {
  return Buffer.from(str, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function enviarCorreo(accessToken, asunto, cuerpo) {
  const perfilRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const perfil = await perfilRes.json();
  const destinatario = perfil.emailAddress;
  if (!destinatario) throw new Error("No se pudo leer el perfil de Gmail: " + JSON.stringify(perfil));

  const mime =
    `To: ${destinatario}\r\n` +
    `Subject: =?utf-8?B?${Buffer.from(asunto, "utf8").toString("base64")}?=\r\n` +
    `Content-Type: text/plain; charset="UTF-8"\r\n\r\n${cuerpo}`;

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: base64url(mime) }),
  });
  if (!res.ok) throw new Error(`Gmail send respondió ${res.status}: ${await res.text()}`);
  return destinatario;
}

// --- Registro de ejecución ---
function registrarLog(linea) {
  if (!existsSync("memory")) mkdirSync("memory");
  const fecha = new Date().toISOString();
  appendFileSync("memory/log.md", `- ${fecha} — ${linea}\n`);
}

async function main() {
  console.log("1/4 memoria: leyendo contexto + recall Mem0...");
  const contexto = leerContexto();
  const recuerdos = await recallMem0("negocio de repuestos y cambio de aceite pendientes");
  console.log(recuerdos);

  console.log("2/4 herramienta: consultando mi-herramienta vía MCP de Supabase...");
  const estadoHerramienta = await estadoMiHerramienta();
  console.log(estadoHerramienta);

  console.log("3/4 redactando el mensaje con Gemini...");
  const { asunto, cuerpo } = await redactarMensaje(contexto, recuerdos, estadoHerramienta);
  console.log(`Asunto: ${asunto}\n${cuerpo}`);

  console.log("4/4 canal de salida: enviando por Gmail...");
  const accessToken = await refrescarAccessToken();
  const destinatario = await enviarCorreo(accessToken, asunto, cuerpo);

  registrarLog(`OpenClaw corrió completo y mandó el correo "${asunto}" a ${destinatario}`);
  console.log(`Listo. Correo enviado a ${destinatario}.`);
}

main().catch((err) => {
  console.error("El OpenClaw falló:", err);
  process.exit(1);
});
