import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DatamintClient } from "../client/datamint.js";
import { DatamintApiError } from "../client/errors.js";

export function registerCrawlTool(server: McpServer, client: DatamintClient): void {
  server.registerTool(
    "datamint_crawl",
    {
      title: "Initiate Deep Crawl",
      description:
        "Start an asynchronous deep crawl across a domain or website path. " +
        "Discovers and traverses links recursively with depth and page bounds, regex path filters, and deduplication. " +
        "Returns a crawl Job ID immediately; progress and extracted pages can be queried with datamint_crawl_status.",
      inputSchema: {
        url: z
          .string()
          .url()
          .describe("The starting seed URL. Must be an absolute http or https URL."),
        max_depth: z
          .number()
          .int()
          .min(0)
          .max(10)
          .optional()
          .describe(
            "Maximum link hops to follow from the seed URL. Default: 1 (seed + direct links). Maximum: 10.",
          ),
        max_pages: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .describe("Maximum total pages to crawl before stopping. Default: 50. Maximum: 1000."),
        path_include: z
          .string()
          .optional()
          .describe("Regex pattern for paths to follow (e.g. '^/docs/.*' or '^/products/')."),
        path_exclude: z
          .string()
          .optional()
          .describe("Regex pattern for paths to skip (e.g. '\\.(pdf|jpg|png|zip)$' or '/admin/')."),
        stealth: z
          .boolean()
          .optional()
          .describe(
            "Route all crawl fetches through residential proxies with stealth armor and anti-bot bypass.",
          ),
        schema: z
          .union([z.string(), z.record(z.unknown())])
          .optional()
          .describe(
            "Registered schema name or JSON Schema to extract from every discovered page in the crawl.",
          ),
        webhook_url: z
          .string()
          .url()
          .optional()
          .describe(
            "Optional HTTPS webhook endpoint to receive an automated notification when the crawl finishes.",
          ),
      },
    },
    async (args) => {
      try {
        const result = await client.crawl({
          url: args.url,
          max_depth: args.max_depth,
          max_pages: args.max_pages,
          path_include: args.path_include,
          path_exclude: args.path_exclude,
          stealth: args.stealth,
          schema: args.schema,
          webhook_url: args.webhook_url,
        });

        const output = [
          `### Crawl Job Enqueued Successfully`,
          `Job ID: \`${result.id}\``,
          `Status: ${result.status.toUpperCase()}`,
          `Seed URL: ${result.seed_url}`,
          `Max Depth: ${result.max_depth} hops`,
          `Max Pages: ${result.max_pages} pages`,
          `Credits Per Page: ${result.credits_per_page}`,
          ``,
          `To check progress or retrieve crawled pages:`,
          `- Call tool \`datamint_crawl_status\` with job_id: \`${result.id}\``,
          `- Or inspect resource \`datamint://crawls/${result.id}\``,
          ``,
          `Note: Credits are consumed per page as pages are fetched. The crawl will stop early if credit balance is exhausted.`,
        ].join("\n");

        return {
          content: [{ type: "text", text: output }],
        };
      } catch (err: unknown) {
        if (err instanceof DatamintApiError) {
          return {
            content: [{ type: "text", text: err.toAgentMessage() }],
            isError: true,
          };
        }
        const error = err as Error;
        return {
          content: [
            {
              type: "text",
              text: `Failed to initiate crawl: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
