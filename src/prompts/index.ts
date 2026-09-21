import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register built-in agent prompt workflows.
 */
export function registerAllPrompts(server: McpServer): void {
  // 1. Research Target
  server.registerPrompt(
    "research_target",
    {
      title: "Research Web Target with Datamint",
      description:
        "Standard workflow for agentic web research: fetches clean Markdown, evaluates confidence, and analyzes key findings.",
      argsSchema: {
        url: z.string().describe("Target website or article URL to research."),
        objective: z
          .string()
          .optional()
          .describe("Specific questions or topics to investigate on this target."),
      },
    },
    async (args) => {
      const url = args.url;
      const objective = args.objective || "Extract and summarize core facts and structured data.";

      return {
        description: `Researching ${url}`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                `You are tasked with researching the following web target: ${url}`,
                `Objective: ${objective}`,
                ``,
                `Instructions:`,
                `1. First, call the tool \`datamint_mint\` with url="${url}".`,
                `2. If the page uses dynamic client rendering (e.g. blank body or loading indicator), re-call \`datamint_mint\` with js=true.`,
                `3. If blocked by anti-bot verification (Cloudflare, Turnstile, DataDome), re-call \`datamint_mint\` with stealth=true.`,
                `4. Review the returned Markdown content, structured metadata, and confidence score.`,
                `5. Synthesize a comprehensive summary directly answering the objective: "${objective}".`,
              ].join("\n"),
            },
          },
        ],
      };
    },
  );

  // 2. Extract Structured Data
  server.registerPrompt(
    "extract_structured_data",
    {
      title: "Extract Structured Data to Schema",
      description:
        "Guide an agent to extract schema-conforming JSON from any product, job, article, or company page.",
      argsSchema: {
        url: z.string().describe("Target URL to extract from."),
        schema: z
          .string()
          .describe(
            "Registered schema name (e.g., 'ecommerce_item', 'article', 'job_posting', 'company_profile') or custom JSON schema description.",
          ),
      },
    },
    async (args) => {
      const { url, schema } = args;

      return {
        description: `Extracting data from ${url} using schema '${schema}'`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                `Extract structured information from: ${url}`,
                `Target schema: ${schema}`,
                ``,
                `Instructions:`,
                `1. Check \`datamint://schemas/${schema}\` if using a registered schema name to review required fields.`,
                `2. Call the tool \`datamint_extract\` with url="${url}" and schema="${schema}".`,
                `3. Verify that the returned schema status is valid and that confidence score is high.`,
                `4. Present the verified JSON payload and highlight any noteworthy extracted entities.`,
              ].join("\n"),
            },
          },
        ],
      };
    },
  );

  // 3. Crawl Knowledge Base
  server.registerPrompt(
    "crawl_knowledge_base",
    {
      title: "Crawl Documentation / Knowledge Base",
      description: "Step-by-step workflow to launch and monitor a targeted site crawl.",
      argsSchema: {
        seed_url: z.string().describe("Root URL of the documentation or site."),
        path_include: z
          .string()
          .optional()
          .describe("Regex path pattern to follow (e.g. '^/docs/.*')."),
        max_pages: z
          .string()
          .optional()
          .describe("Estimated max pages to crawl (e.g. '30')."),
      },
    },
    async (args) => {
      const { seed_url, path_include, max_pages } = args;
      const pagesInt = max_pages ? parseInt(max_pages, 10) : 30;

      return {
        description: `Crawl knowledge base starting at ${seed_url}`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                `Please initiate and monitor a crawl of the knowledge base at: ${seed_url}`,
                path_include ? `Path inclusion filter: ${path_include}` : null,
                `Target volume: ~${pagesInt} pages.`,
                ``,
                `Steps:`,
                `1. First, call \`datamint_estimate_cost\` with mode="crawl", pages=${pagesInt} to budget credits.`,
                `2. Call \`datamint_crawl\` with:`,
                `   - url: "${seed_url}"`,
                path_include ? `   - path_include: "${path_include}"` : null,
                `   - max_pages: ${pagesInt}`,
                `   - max_depth: 3`,
                `3. Save the returned Job ID and call \`datamint_crawl_status\` periodically to monitor progress.`,
                `4. When completed, synthesize the indexed knowledge structure.`,
              ]
                .filter(Boolean)
                .join("\n"),
            },
          },
        ],
      };
    },
  );
}
