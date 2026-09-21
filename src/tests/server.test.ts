import test from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createDatamintMcpServer } from "../server.js";

test("MCP server full protocol handshake, tools, resources, and execution", async () => {
  const { server } = createDatamintMcpServer({
    apiKey: "mint_test_0123456789abcdef0123456789abcdef",
    baseUrl: "https://api.datamint.xyz",
    timeoutMs: 10000,
    transport: "stdio",
    port: 3001,
    host: "0.0.0.0",
  });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  // Create MCP client
  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} },
  );

  // Connect both sides
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  // 1. Verify listTools
  const toolsResult = await client.listTools();
  const toolNames = toolsResult.tools.map((t) => t.name);

  assert.ok(toolNames.includes("datamint_mint"));
  assert.ok(toolNames.includes("datamint_extract"));
  assert.ok(toolNames.includes("datamint_crawl"));
  assert.ok(toolNames.includes("datamint_crawl_status"));
  assert.ok(toolNames.includes("datamint_estimate_cost"));
  assert.equal(toolNames.length, 5);

  // 2. Verify listResources
  const resourcesResult = await client.listResources();
  const resourceUris = resourcesResult.resources.map((r) => r.uri);

  assert.ok(resourceUris.includes("datamint://schemas"));
  assert.ok(resourceUris.includes("datamint://system/status"));

  // 3. Verify readResource datamint://schemas
  const readResult = await client.readResource({ uri: "datamint://schemas" });
  assert.equal(readResult.contents.length, 1);
  const firstContent = readResult.contents[0];
  assert.ok("text" in firstContent);
  const parsedCatalog = JSON.parse(firstContent.text);
  assert.ok(Array.isArray(parsedCatalog));
  assert.ok(parsedCatalog.some((s: { name: string }) => s.name === "ecommerce_item"));

  // 4. Verify listPrompts
  const promptsResult = await client.listPrompts();
  const promptNames = promptsResult.prompts.map((p) => p.name);

  assert.ok(promptNames.includes("research_target"));
  assert.ok(promptNames.includes("extract_structured_data"));
  assert.ok(promptNames.includes("crawl_knowledge_base"));

  // 5. Verify callTool: datamint_estimate_cost
  const callResult = await client.callTool({
    name: "datamint_estimate_cost",
    arguments: {
      mode: "extract",
      stealth: true,
    },
  });

  assert.equal(Boolean(callResult.isError), false);
  const textContent = (callResult.content as Array<{ type: string; text: string }>)[0]?.text;
  assert.ok(textContent);
  assert.ok(textContent.includes("17 credits"));
  assert.ok(textContent.includes("$0.0170 USD"));

  // Clean up
  await client.close();
  await server.close();
});
