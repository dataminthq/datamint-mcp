import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { resolveConfig, looksLikeApiKey } from "./config.js";
import { createDatamintMcpServer } from "./server.js";
import { createSseHttpServer } from "./sse.js";

async function main(): Promise<void> {
  const config = resolveConfig();

  // Diagnostic warning if API key is not present or non-standard format
  if (!config.apiKey) {
    console.error(
      "[datamint-mcp] Warning: DATAMINT_API_KEY is not set. " +
        "Extraction and crawling tools will fail unless configured or running against a mock backend. " +
        "Get your key at https://datamint.xyz/dashboard/keys",
    );
  } else if (!looksLikeApiKey(config.apiKey)) {
    console.error(
      "[datamint-mcp] Notice: Provided API key does not start with 'mint_live_' or 'mint_test_'. " +
        "Ensure you are using a valid Datamint key.",
    );
  }

  if (config.transport === "stdio") {
    const { server } = createDatamintMcpServer(config);
    const transport = new StdioServerTransport();
    console.error(
      `[datamint-mcp] Starting Datamint MCP server via stdio transport (API: ${config.baseUrl})`,
    );

    await server.connect(transport);

    const shutdown = async (): Promise<void> => {
      console.error("[datamint-mcp] Shutting down stdio server...");
      await server.close();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } else {
    // SSE HTTP Server mode: one McpServer per connected client
    const { httpServer, closeAllSessions } = createSseHttpServer(config);

    httpServer.listen(config.port, config.host, () => {
      console.error(
        `[datamint-mcp] SSE HTTP server listening on http://${config.host}:${config.port}/sse (API: ${config.baseUrl})`,
      );
    });

    const shutdown = async (): Promise<void> => {
      console.error("[datamint-mcp] Shutting down SSE server...");
      httpServer.close();
      await closeAllSessions();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }
}

main().catch((err) => {
  console.error("[datamint-mcp] Fatal server startup error:", err);
  process.exit(1);
});
