import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DatamintClient } from "../client/datamint.js";

export function registerCrawlResources(server: McpServer, client: DatamintClient): void {
  server.registerResource(
    "crawl_results_resource",
    new ResourceTemplate("datamint://crawls/{id}", { list: undefined }),
    {
      title: "Crawl Job Inspection",
      description: "Direct access to status, statistics, and extracted pages for a crawl job ID.",
      mimeType: "application/json",
    },
    async (uri, { id }) => {
      const jobId = String(id);
      try {
        const crawl = await client.getCrawlStatus(jobId);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(crawl, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        const error = err as Error;
        throw new Error(`Failed to read crawl resource '${jobId}': ${error.message}`);
      }
    },
  );
}
