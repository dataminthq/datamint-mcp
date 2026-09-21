import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DatamintClient } from "../client/datamint.js";

export function registerEstimateCostTool(server: McpServer, client: DatamintClient): void {
  server.registerTool(
    "datamint_estimate_cost",
    {
      title: "Estimate Workload Credit Cost",
      description:
        "Calculate the exact credit cost and USD value for a planned Datamint operation before executing it. " +
        "Transparently accounts for static vs dynamic rendering, stealth armor, and schema validation.",
      inputSchema: {
        mode: z
          .enum(["mint", "extract", "crawl"])
          .describe("The Datamint operation type."),
        js: z
          .boolean()
          .optional()
          .describe("Whether dynamic headless browser rendering will be enabled."),
        stealth: z
          .boolean()
          .optional()
          .describe("Whether stealth residential proxy routing and CAPTCHA solving will be enabled."),
        has_schema: z
          .boolean()
          .optional()
          .describe("Whether schema extraction will be applied (always true for extract mode)."),
        pages: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Number of pages (relevant for crawl mode). Default: 1."),
      },
    },
    async (args) => {
      const isExtract = args.mode === "extract";
      const hasSchema = isExtract || Boolean(args.has_schema);
      const isCrawl = args.mode === "crawl";
      // Crawl is always at minimum a browser workload (js: true)
      const js = isCrawl ? true : Boolean(args.js);
      const stealth = Boolean(args.stealth);
      const pages = args.pages ?? 1;

      const estimate = client.estimateCost(
        {
          js,
          stealth,
          schema: hasSchema,
        },
        pages,
      );

      const report = [
        `### Datamint Cost Estimate (${args.mode.toUpperCase()})`,
        `Per-Page Credit Cost: ${estimate.creditCostPerPage} credits ($${(
          estimate.creditCostPerPage / 1000
        ).toFixed(3)})`,
        pages > 1 ? `Target Page Volume: ${pages} pages` : null,
        `Total Estimated Credits: ${estimate.totalEstimatedCredits.toLocaleString()} credits`,
        `Total Estimated Cost: $${estimate.costInUsd.toFixed(4)} USD`,
        ``,
        `Calculation Breakdown:`,
        `- ${estimate.explanation}`,
        `- Pricing Rate: $1.00 USD = 1,000 Data Credits ($0.001 / credit)`,
        `- Guaranteed: Blocked requests that return zero usable data cost 0 credits.`,
      ]
        .filter(Boolean)
        .join("\n");

      return {
        content: [{ type: "text", text: report }],
      };
    },
  );
}
