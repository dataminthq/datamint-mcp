import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DatamintClient } from "../client/datamint.js";
import { DatamintApiError } from "../client/errors.js";

export function registerMintTool(server: McpServer, client: DatamintClient): void {
  server.registerTool(
    "datamint_mint",
    {
      title: "Mint Page (LLM Markdown / Structured JSON)",
      description:
        "Extract clean, LLM-optimized Markdown or structured JSON from any public web page. " +
        "Strips navigation, boilerplate, ads, and tracking scripts while preserving semantic document structure. " +
        "Supports dynamic JavaScript rendering (js: true) and anti-bot bypass for Cloudflare/DataDome (stealth: true).",
      inputSchema: {
        url: z
          .string()
          .url()
          .describe("The target web page URL. Must be an absolute http or https URL."),
        js: z
          .boolean()
          .optional()
          .describe(
            "Render in a headless browser before extracting. Required for client-side SPAs (React/Vue). Costs 5 credits.",
          ),
        stealth: z
          .boolean()
          .optional()
          .describe(
            "Route through residential proxies with fingerprint mutation and automated CAPTCHA solving. " +
              "Use when targets block standard access with Cloudflare Turnstile or DataDome. Costs 15 credits.",
          ),
        schema: z
          .union([z.string(), z.record(z.unknown())])
          .optional()
          .describe(
            "Registered schema name (e.g. 'ecommerce_item', 'article', 'job_posting') or inline JSON Schema. Adds 2 credits.",
          ),
        include_screenshot: z
          .boolean()
          .optional()
          .describe("Include a screenshot of the rendered page as visual evidence."),
        include_html: z
          .boolean()
          .optional()
          .describe("Include sanitized HTML DOM in the response."),
        wait_for_selector: z
          .string()
          .optional()
          .describe("Optional CSS selector to wait for before extracting content."),
        timeout: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Extraction timeout in seconds."),
        no_cache: z
          .boolean()
          .optional()
          .describe("Bypass response cache and force fresh extraction from the target server."),
        api_key: z
          .string()
          .optional()
          .describe("Optional Datamint API key (mint_live_... or mint_test_...). Overrides default server key."),
      },
    },
    async (args) => {
      try {
        const result = await client.mint({
          url: args.url,
          api_key: args.api_key,
          js: args.js,
          stealth: args.stealth,
          schema: args.schema,
          include_screenshot: args.include_screenshot,
          include_html: args.include_html,
          wait_for_selector: args.wait_for_selector,
          timeout: args.timeout,
          no_cache: args.no_cache,
        });

        const meta = result._mint_meta;
        const metaText = [
          `--- Datamint Metadata ---`,
          `URL: ${result.url || args.url}`,
          `Confidence: ${(meta.confidence * 100).toFixed(0)}%${meta.low_confidence ? " (LOW - review recommended)" : ""}`,
          `Tier: ${meta.tier}${meta.cached ? " (cached)" : ""}`,
          `Credits Used: ${meta.credits} (Remaining Balance: ${meta.balance_after >= 0 ? meta.balance_after : "unlimited/test"})`,
          `Latency: ${meta.latency_ms}ms`,
          meta.captcha_solved ? `CAPTCHA Solved: Yes` : null,
          `-------------------------`,
        ]
          .filter(Boolean)
          .join("\n");

        let bodyText = "";

        // If schema or structured data was returned
        if (result.structured && Object.keys(result.structured).length > 0) {
          bodyText += `### Structured Data:\n\`\`\`json\n${JSON.stringify(
            result.structured,
            null,
            2,
          )}\n\`\`\`\n\n`;
        }

        // Main content markdown
        bodyText += `### Extracted Markdown Content:\n\n${result.markdown || "(No text content extracted)"}`;

        // Sanitized HTML if requested
        if (result.evidence?.html) {
          bodyText += `\n\n### HTML Evidence:\n\`\`\`html\n${result.evidence.html.slice(
            0,
            20000,
          )}${result.evidence.html.length > 20000 ? "\n...[truncated]" : ""}\n\`\`\``;
        }

        const content: Array<
          | { type: "text"; text: string }
          | { type: "image"; data: string; mimeType: string }
        > = [
          {
            type: "text",
            text: `${bodyText}\n\n${metaText}`,
          },
        ];

        // Append visual evidence if screenshot was captured
        if (result.evidence?.screenshot) {
          content.push({
            type: "image",
            data: result.evidence.screenshot,
            mimeType: "image/png",
          });
        }

        return { content };
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
              text: `Unexpected extraction error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
