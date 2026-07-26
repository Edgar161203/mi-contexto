import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const PROJECT_REF = "eccpmhaiowuiiojatidr";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "@supabase/mcp-server-supabase", `--project-ref=${PROJECT_REF}`, "--read-only"],
  env: { SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN ?? "" },
});

const client = new Client({ name: "briefing-diario", version: "1.0.0" });
await client.connect(transport);

const result = await client.callTool({ name: "list_edge_functions", arguments: {} });
const parsed = JSON.parse(result.content[0].text);

if (parsed.error) {
  console.log(`no se pudo confirmar el estado de mi-herramienta (${parsed.error.message})`);
} else {
  const fn = parsed.functions?.find((f) => f.slug === "mi-herramienta");
  console.log(
    fn
      ? `mi-herramienta está ${fn.status} (versión ${fn.version})`
      : "mi-herramienta no aparece listada en el proyecto"
  );
}

await client.close();
process.exit(0);
