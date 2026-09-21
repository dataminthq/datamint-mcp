import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DatamintClient } from "../client/datamint.js";
import { DatamintApiError } from "../client/errors.js";

export function registerExtractTool(server: McpServer, client: DatamintClient): void {
  server.registerTool(
    "datamint_extract",
    {
      title: "Zero-Code Schema Extraction",
      description:
        "Extract structured JSON adhering to a provided JSON Schema or registered schema template " +
        "(e.g., 'ecommerce_item', 'article', 'job_posting', 'company_profile'). " +
        "Eliminates per-site CSS selectors. Uses autonomous structural mapping and validation to return typed JSON.",
      inputSchema: {
        url: z
          .string()
          .url()
          .describe("The target web page URL to extract from."),
        schema: z
          .union([z.string(), z.record(z.unknown())])
          .describe(
            "Target data shape: either a registered schema name ('ecommerce_item', 'article', 'job_posting') " +
              "or an inline JSON Schema object specifying properties, types, and required fields.",
          ),
        js: z
          .boolean()
          .optional()
          .describe(
            "Render in headless browser before extraction. Recommended for dynamic SPAs. Costs 7 credits with schema.",
          ),
        stealth: z
          .boolean()
          .optional()
          .describe(
            "Use stealth residential proxy routing and anti-bot bypass. Costs 17 credits with schema.",
          ),
        wait_for_selector: z
          .string()
          .optional()
          .describe("Optional CSS selector to wait for before extracting content."),
        no_cache: z
          .boolean()
          .optional()
          .describe("Bypass response cache and force fresh extraction."),
        api_key: z
          .string()
          .optional()
          .describe("Optional Datamint API key (mint_live_... or mint_test_...). Overrides default server key."),
      },
    },
    async (args) => {
      try {
        const result = await client.extract({
          url: args.url,
          schema: args.schema,
          api_key: args.api_key,
          js: args.js,
          stealth: args.stealth,
          wait_for_selector: args.wait_for_selector,
          no_cache: args.no_cache,
        });

        const meta = result._mint_meta;
        const schemaStatus = result.schema?.valid ? "VALID" : "VIOLATIONS DETECTED";

        let report = `### Extracted JSON Data:\n\`\`\`json\n${JSON.stringify(
          result.data,
          null,
          2,
        )}\n\`\`\`\n\n`;

        report += `### Schema Validation: ${schemaStatus}\n`;
        if (result.schema?.violations && result.schema.violations.length > 0) {
          report += `Violations:\n\`\`\`json\n${JSON.stringify(
            result.schema.violations,
            null,
            2,
          )}\n\`\`\`\n\n`;
        }

        report += [
          `--- Datamint Metadata ---`,
          `URL: ${args.url}`,
          `Confidence Score: ${(meta.confidence * 100).toFixed(0)}%`,
          `Tier: ${meta.tier}${meta.cached ? " (cached)" : ""}`,
          `Credits Consumed: ${meta.credits} (Remaining Balance: ${
            meta.balance_after >= 0 ? meta.balance_after : "unlimited/test"
          })`,
          `Latency: ${meta.latency_ms}ms`,
          `-------------------------`,
        ].join("\n");

        return {
          content: [{ type: "text", text: report }],
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
              text: `Schema extraction failed: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
