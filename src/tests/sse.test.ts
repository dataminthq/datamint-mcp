import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { createSseHttpServer } from "../sse.js";
import type { DatamintConfig } from "../config.js";

const TEST_CONFIG: DatamintConfig = {
  apiKey: "mint_test_0123456789abcdef0123456789abcdef",
  baseUrl: "https://api.datamint.xyz",
  timeoutMs: 10000,
  transport: "sse",
  port: 0,
  host: "127.0.0.1",
};

function listen(server: ReturnType<typeof createSseHttpServer>["httpServer"]): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve((server.address() as AddressInfo).port);
    });
  });
}

test("SSE transport serves multiple concurrent clients without cross-session bleed", async () => {
  const { httpServer, closeAllSessions } = createSseHttpServer(TEST_CONFIG);
  const port = await listen(httpServer);
  const base = `http://127.0.0.1:${port}`;

  try {
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);

    const connectClient = async (name: string): Promise<Client> => {
      const client = new Client({ name, version: "1.0.0" }, { capabilities: {} });
      await client.connect(new SSEClientTransport(new URL(`${base}/sse`)));
      return client;
    };

    // A second concurrent connection previously crashed the server with
    // "Already connected to a transport" as an unhandled rejection.
    const [clientA, clientB] = await Promise.all([connectClient("client-a"), connectClient("client-b")]);

    const [toolsA, toolsB] = await Promise.all([clientA.listTools(), clientB.listTools()]);
    assert.equal(toolsA.tools.length, 5);
    assert.equal(toolsB.tools.length, 5);

    // Responses must return through each client's own session stream.
    const [resultA, resultB] = await Promise.all([
      clientA.callTool({ name: "datamint_estimate_cost", arguments: { mode: "extract", stealth: true } }),
      clientB.callTool({ name: "datamint_estimate_cost", arguments: { mode: "mint", js: true } }),
    ]);
    const textA = (resultA.content as Array<{ type: string; text: string }>)[0]?.text ?? "";
    const textB = (resultB.content as Array<{ type: string; text: string }>)[0]?.text ?? "";
    assert.ok(textA.includes("17 credits"), `expected extract+stealth cost in: ${textA}`);
    assert.ok(textB.includes("5 credits"), `expected mint js cost in: ${textB}`);

    // Unknown sessionId is rejected with a clean 400 instead of crashing.
    const unknown = await fetch(`${base}/message?sessionId=does-not-exist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
    });
    assert.equal(unknown.status, 400);

    await clientA.close();
    await clientB.close();

    const healthAfter = await fetch(`${base}/health`);
    assert.equal(healthAfter.status, 200);
  } finally {
    httpServer.close();
    await closeAllSessions();
  }
});
