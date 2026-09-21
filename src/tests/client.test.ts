import test from "node:test";
import assert from "node:assert/strict";
import { DatamintClient } from "../client/datamint.js";
import { DatamintApiError } from "../client/errors.js";
import { looksLikeApiKey, resolveConfig } from "../config.js";
import { REGISTERED_SCHEMAS } from "../resources/schemas.js";

test("looksLikeApiKey validates key formats correctly", () => {
  assert.equal(looksLikeApiKey("mint_live_0123456789abcdef0123456789abcdef"), true);
  assert.equal(looksLikeApiKey("mint_test_0123456789abcdef0123456789abcdef"), true);
  assert.equal(looksLikeApiKey("sk_test_12345"), false);
  assert.equal(looksLikeApiKey("random_string"), false);
  assert.equal(looksLikeApiKey(""), false);
});

test("resolveConfig respects CLI arguments and environment defaults", () => {
  const cfg = resolveConfig([
    "--api-key",
    "mint_live_testkey123456789012345",
    "--base-url",
    "https://custom.datamint.xyz/",
    "--transport",
    "sse",
    "--port",
    "4000",
  ]);

  assert.equal(cfg.apiKey, "mint_live_testkey123456789012345");
  assert.equal(cfg.baseUrl, "https://custom.datamint.xyz");
  assert.equal(cfg.transport, "sse");
  assert.equal(cfg.port, 4000);
});

test("DatamintClient calculates workload costs accurately according to BUSINESS.md", () => {
  const client = new DatamintClient({
    baseUrl: "https://api.datamint.xyz",
    timeoutMs: 5000,
    transport: "stdio",
    port: 3001,
    host: "0.0.0.0",
  });

  // 1. Static fast fetch = 1 credit ($0.001)
  const est1 = client.estimateCost({ js: false, stealth: false, schema: false });
  assert.equal(est1.creditCostPerPage, 1);
  assert.equal(est1.totalEstimatedCredits, 1);
  assert.equal(est1.costInUsd, 0.001);

  // 2. Static with schema = 1 + 2 = 3 credits ($0.003)
  const est2 = client.estimateCost({ js: false, stealth: false, schema: true });
  assert.equal(est2.creditCostPerPage, 3);
  assert.equal(est2.totalEstimatedCredits, 3);
  assert.equal(est2.costInUsd, 0.003);

  // 3. Headless browser render = 5 credits ($0.005)
  const est3 = client.estimateCost({ js: true, stealth: false, schema: false });
  assert.equal(est3.creditCostPerPage, 5);
  assert.equal(est3.costInUsd, 0.005);

  // 4. Headless browser render with schema = 5 + 2 = 7 credits ($0.007)
  const est4 = client.estimateCost({ js: true, stealth: false, schema: true });
  assert.equal(est4.creditCostPerPage, 7);
  assert.equal(est4.costInUsd, 0.007);

  // 5. Stealth armor bypass = 15 credits ($0.015)
  const est5 = client.estimateCost({ js: false, stealth: true, schema: false });
  assert.equal(est5.creditCostPerPage, 15);
  assert.equal(est5.costInUsd, 0.015);

  // 6. Stealth armor bypass with schema = 15 + 2 = 17 credits ($0.017)
  const est6 = client.estimateCost({ js: true, stealth: true, schema: true });
  assert.equal(est6.creditCostPerPage, 17);
  assert.equal(est6.costInUsd, 0.017);

  // 7. Crawl across 25 pages with stealth
  const est7 = client.estimateCost({ js: true, stealth: true, schema: false }, 25);
  assert.equal(est7.creditCostPerPage, 15);
  assert.equal(est7.totalEstimatedCredits, 375);
  assert.equal(est7.costInUsd, 0.375);
});

test("DatamintApiError produces informative agent-directed error messages", () => {
  const err = new DatamintApiError(
    "insufficient_credits",
    "Insufficient credits",
    402,
    {
      code: "insufficient_credits",
      message: "Insufficient credits",
      required: 15,
      balance: 4,
    },
  );

  const msg = err.toAgentMessage();
  assert.ok(msg.includes("insufficient_credits"));
  assert.ok(msg.includes("Required credits: 15"));
  assert.ok(msg.includes("Current balance: 4"));
  assert.ok(msg.includes("https://datamint.xyz/pricing"));
});

test("REGISTERED_SCHEMAS contains standard expected schemas", () => {
  assert.ok(REGISTERED_SCHEMAS.ecommerce_item);
  assert.ok(REGISTERED_SCHEMAS.article);
  assert.ok(REGISTERED_SCHEMAS.job_posting);
  assert.ok(REGISTERED_SCHEMAS.company_profile);
  assert.ok(REGISTERED_SCHEMAS.real_estate_listing);
  assert.ok(REGISTERED_SCHEMAS.faq);

  assert.equal(REGISTERED_SCHEMAS.ecommerce_item.type, "object");
  assert.deepEqual(REGISTERED_SCHEMAS.ecommerce_item.required, ["title", "price"]);
});
