import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DatamintClient } from "../client/datamint.js";
import { registerMintTool } from "./mint.js";
import { registerExtractTool } from "./extract.js";
import { registerCrawlTool } from "./crawl.js";
import { registerCrawlStatusTool } from "./crawl-status.js";
import { registerEstimateCostTool } from "./estimate-cost.js";

/**
 * Register all Datamint tools onto the MCP server.
 */
export function registerAllTools(server: McpServer, client: DatamintClient): void {
  registerMintTool(server, client);
  registerExtractTool(server, client);
  registerCrawlTool(server, client);
  registerCrawlStatusTool(server, client);
  registerEstimateCostTool(server, client);
}
