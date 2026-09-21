import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DatamintClient } from "../client/datamint.js";
import { registerSchemaResources } from "./schemas.js";
import { registerSystemStatusResource } from "./system-status.js";
import { registerCrawlResources } from "./crawls.js";

/**
 * Register all Datamint resources onto the MCP server.
 */
export function registerAllResources(server: McpServer, client: DatamintClient): void {
  registerSchemaResources(server);
  registerSystemStatusResource(server, client);
  registerCrawlResources(server, client);
}
