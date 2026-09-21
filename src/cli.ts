import http from "node:http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { resolveConfig, looksLikeApiKey } from "./config.js";
import { createDatamintMcpServer } from "./server.js";

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

  const { server } = createDatamintMcpServer(config);

  if (config.transport === "stdio") {
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
    // SSE HTTP Server mode
    let transport: SSEServerTransport | null = null;

    const httpServer = http.createServer(async (req, res) => {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

      // Enable CORS for web agent clients
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === "GET" && url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", service: "datamint-mcp", version: "0.1.0" }));
        return;
      }

      if (req.method === "GET" && url.pathname === "/sse") {
        transport = new SSEServerTransport("/message", res);
        await server.connect(transport);
        return;
      }

      if (req.method === "POST" && url.pathname === "/message") {
        if (!transport) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("No active SSE session found. Connect to /sse first.");
          return;
        }
        await transport.handlePostMessage(req, res);
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found. Available endpoints: GET /sse, POST /message, GET /health");
    });

    httpServer.listen(config.port, config.host, () => {
      console.error(
        `[datamint-mcp] SSE HTTP server listening on http://${config.host}:${config.port}/sse (API: ${config.baseUrl})`,
      );
    });

    const shutdown = async (): Promise<void> => {
      console.error("[datamint-mcp] Shutting down SSE server...");
      httpServer.close();
      await server.close();
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
