import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DatamintClient } from "../client/datamint.js";
import { DatamintApiError } from "../client/errors.js";

export function registerCrawlStatusTool(server: McpServer, client: DatamintClient): void {
  server.registerTool(
    "datamint_crawl_status",
    {
      title: "Get Crawl Job Status & Pages",
      description:
        "Check progress and retrieve results for a previously submitted crawl job. " +
        "Returns overall job status (queued, running, completed, failed), page count progress, credits consumed, " +
        "and extracted page contents.",
      inputSchema: {
        job_id: z
          .string()
          .describe("The crawl job UUID returned by datamint_crawl."),
        include_pages: z
          .boolean()
          .optional()
          .describe(
            "Whether to include extracted page bodies in the response. Set to false for a lightweight progress check.",
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Maximum number of completed pages to include in the output. Default: 20."),
      },
    },
    async (args) => {
      try {
        const result = await client.getCrawlStatus(args.job_id);

        let report = [
          `### Crawl Job Status: ${result.status.toUpperCase()}`,
          `Job ID: \`${result.id}\``,
          `Seed URL: ${result.seed_url}`,
          `Progress: ${result.pages_done} completed / ${result.pages_failed} failed (Max: ${result.max_pages})`,
          `Credits Used: ${result.credits_used}`,
          `Created: ${result.created_at}`,
          result.completed_at ? `Completed: ${result.completed_at}` : `Updated: ${result.updated_at}`,
        ];

        if (result.error) {
          report.push(`Error Detail: ${result.error}`);
        }

        const includePages = args.include_pages ?? true;
        const limit = args.limit ?? 20;

        if (includePages && result.pages && result.pages.length > 0) {
          report.push(``, `### Crawled Pages (${Math.min(limit, result.pages.length)} of ${result.pages.length}):`);
          const slice = result.pages.slice(0, limit);

          for (const page of slice) {
            report.push(`---`);
            report.push(`URL: ${page.url} (Depth: ${page.depth}, Status: ${page.status})`);
            if (page.data) {
              report.push(`Data:\n\`\`\`json\n${JSON.stringify(page.data, null, 2)}\n\`\`\``);
            } else if (page.markdown) {
              const snippet =
                page.markdown.length > 1500
                  ? page.markdown.slice(0, 1500) + "\n...[truncated]"
                  : page.markdown;
              report.push(`Markdown:\n${snippet}`);
            } else if (page.error) {
              report.push(`Error: ${page.error}`);
            }
          }
        }

        return {
          content: [{ type: "text", text: report.join("\n") }],
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
              text: `Failed to get crawl status: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
