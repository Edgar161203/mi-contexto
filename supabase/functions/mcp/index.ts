// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";

// Servidor MCP público del taller de repuestos y cambio de aceite de Edgar.
// Sin apikey ni JWT: habla el protocolo MCP (JSON-RPC 2.0) para que cualquier
// cliente MCP (o el verificador del certificado de la Academia) pueda hacer
// tools/list sin credenciales.

const PROTOCOL_VERSION = "2024-11-05";
const REPO_RAW = "https://raw.githubusercontent.com/Edgar161203/mi-contexto/master";

const TOOLS = [
  {
    name: "estado_taller",
    description:
      "Consulta el estado del taller de repuestos y cambio de aceite de Edgar en Mérida: tiempo estimado del servicio de cambio de aceite y cómo se confirman los precios.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "ultima_ejecucion_openclaw",
    description:
      "Devuelve el registro más reciente de una corrida real del OpenClaw de Edgar (memory/log.md del repo).",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "resumen_negocio",
    description:
      "Resume el negocio real de Edgar (repuestos y cambio de aceite) a partir de los archivos de contexto de su repo.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

function jsonRpcResult(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function callTool(name: string) {
  if (name === "estado_taller") {
    return {
      content: [
        {
          type: "text",
          text:
            "Cambio de aceite: 30 a 45 minutos aprox. Precios de repuestos y servicio siempre en $ y Bs, " +
            "y se confirman con el negocio antes de cerrar la venta (no se inventa disponibilidad).",
        },
      ],
    };
  }

  if (name === "ultima_ejecucion_openclaw") {
    const res = await fetch(`${REPO_RAW}/memory/log.md`);
    const text = await res.text();
    const lines = text.trim().split("\n").filter(Boolean);
    const ultima = lines.at(-1)?.replace(/^- /, "") ?? "Aún no hay corridas registradas.";
    return { content: [{ type: "text", text: ultima }] };
  }

  if (name === "resumen_negocio") {
    const res = await fetch(`${REPO_RAW}/que-hago.md`);
    const text = await res.text();
    return { content: [{ type: "text", text: text.trim() }] };
  }

  throw new Error(`Herramienta desconocida: ${name}`);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, mcp-protocol-version",
};

export default {
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return Response.json(
        { status: "ok", protocol: "mcp", transport: "streamable-http" },
        { headers: corsHeaders },
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json(jsonRpcError(null, -32700, "Parse error"), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { id, method, params } = body ?? {};

    // Notificaciones (sin id): se aceptan y no llevan respuesta con contenido.
    if (id === undefined) {
      return new Response(null, { status: 202, headers: corsHeaders });
    }

    try {
      switch (method) {
        case "initialize":
          return Response.json(
            jsonRpcResult(id, {
              protocolVersion: PROTOCOL_VERSION,
              capabilities: { tools: {} },
              serverInfo: { name: "repuestos-edgar-mcp", version: "1.0.0" },
            }),
            { headers: corsHeaders },
          );

        case "tools/list":
          return Response.json(jsonRpcResult(id, { tools: TOOLS }), {
            headers: corsHeaders,
          });

        case "tools/call": {
          const result = await callTool(params?.name);
          return Response.json(jsonRpcResult(id, result), {
            headers: corsHeaders,
          });
        }

        default:
          return Response.json(
            jsonRpcError(id, -32601, `Method not found: ${method}`),
            { headers: corsHeaders },
          );
      }
    } catch (err) {
      return Response.json(
        jsonRpcError(id, -32603, err instanceof Error ? err.message : "Internal error"),
        { headers: corsHeaders },
      );
    }
  },
};

/* Probar:

curl -i --location --request POST 'https://eccpmhaiowuiiojatidr.supabase.co/functions/v1/mcp' \
  --header 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

*/
