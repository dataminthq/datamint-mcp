import http from "node:http";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import type { DatamintConfig } from "./config.js";
import { createDatamintMcpServer } from "./server.js";

interface SseSession {
  server: McpServer;
  transport: SSEServerTransport;
}

/**
 * HTTP server for the SSE transport. Each connected client gets its own
 * McpServer instance and SSEServerTransport, routed by sessionId, because
 * the SDK's Protocol.connect() accepts a single transport per server.
 */
export function createSseHttpServer(config: DatamintConfig): {
  httpServer: http.Server;
  closeAllSessions: () => Promise<void>;
} {
  const sessions = new Map<string, SseSession>();

  const closeAllSessions = async (): Promise<void> => {
    for (const session of sessions.values()) {
      await session.server.close().catch(() => {});
    }
    sessions.clear();
  };

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    // Enable CORS for web agent clients
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    try {
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
        const { server } = createDatamintMcpServer(config);
        const transport = new SSEServerTransport("/message", res);
        sessions.set(transport.sessionId, { server, transport });
        transport.onclose = () => {
          sessions.delete(transport.sessionId);
        };
        await server.connect(transport);
        return;
      }

      if (req.method === "POST" && url.pathname === "/message") {
        const sessionId = url.searchParams.get("sessionId");
        const session = sessionId ? sessions.get(sessionId) : undefined;
        if (!session) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("No active SSE session found. Connect to /sse first.");
          return;
        }
        await session.transport.handlePostMessage(req, res);
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found. Available endpoints: GET /sse, POST /message, GET /health");
    } catch (err: unknown) {
      const error = err as Error;
      console.error("[datamint-mcp] SSE request error:", error.message);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
      }
      res.end(`Internal server error: ${error.message}`);
    }
  });

  return { httpServer, closeAllSessions };
}
