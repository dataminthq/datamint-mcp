import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DatamintConfig } from "./config.js";
import { DatamintClient } from "./client/datamint.js";
import { registerAllTools } from "./tools/index.js";
import { registerAllResources } from "./resources/index.js";
import { registerAllPrompts } from "./prompts/index.js";

/**
 * Factory function creating a fully configured Datamint MCP Server.
 */
export function createDatamintMcpServer(config: DatamintConfig): {
  server: McpServer;
  client: DatamintClient;
} {
  const client = new DatamintClient(config);

  const server = new McpServer(
    {
      name: "datamint",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {},
      },
    },
  );

  // Register tools, resources, and prompts
  registerAllTools(server, client);
  registerAllResources(server, client);
  registerAllPrompts(server);

  return { server, client };
}
