import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DatamintClient } from "../client/datamint.js";

export function registerSystemStatusResource(server: McpServer, client: DatamintClient): void {
  server.registerResource(
    "datamint_system_status",
    "datamint://system/status",
    {
      title: "Datamint Fleet & Engine Health Status",
      description:
        "Real-time operational status of Datamint crawler fleet, headless browser workers, and proxy tiers.",
      mimeType: "application/json",
    },
    async (uri) => {
      try {
        const health = await client.health();
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  ...health,
                  checked_at: new Date().toISOString(),
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (err: unknown) {
        const error = err as Error;
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  status: "unreachable",
                  service: "datamint",
                  error: error.message,
                  checked_at: new Date().toISOString(),
                },
                null,
                2,
              ),
            },
          ],
        };
      }
    },
  );
}
