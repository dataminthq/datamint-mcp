# @datamint/mcp — Official Datamint Model Context Protocol Server

[![npm version](https://img.shields.io/npm/v/@datamint/mcp.svg)](https://www.npmjs.com/package/@datamint/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

The official **Model Context Protocol (MCP)** server for **[datamint.xyz](https://datamint.xyz)**.

Connect any AI agent directly to Datamint's high-throughput web scraping and data extraction infrastructure. Turn bot-defended, dynamic websites into clean, deterministic LLM-optimized Markdown and schema-validated JSON without custom crawler boilerplate.

---

## Capabilities at a Glance

- **⚡ Fast HTTP Fetch (1 credit)**: Sub-second static page extraction with BoringSSL JA4/TLS fingerprinting.
- **🛡️ Stealth Armor (15 credits)**: Bypasses Cloudflare Under Attack Mode, Turnstile, and DataDome via residential proxy pools and browser fingerprint mutation.
- **🌐 Dynamic Headless Fleet (5 credits)**: Hardened browser execution for client-side SPAs (React, Vue, Next.js).
- **📋 Zero-Code Schema Extraction (+2 credits)**: Transform messy web pages directly into typed JSON matching any custom JSON Schema or registered templates (`ecommerce_item`, `article`, `job_posting`, etc.).
- **🕷️ Asynchronous Deep Crawl**: Traverse domains with regex path filters (`path_include`, `path_exclude`), depth limits (0–10), deduplication, and progress monitoring.
- **📸 Evidence & Provenance**: Optional screenshots and sanitized HTML snapshots.
- **🔄 Dual Transport**: Native `stdio` for desktop agent clients (Claude Desktop, Cursor) and `sse` (Server-Sent Events) for hosted deployments (`mcp.datamint.xyz`).

---

## Quickstart & Agent Integration

You can use Datamint MCP in two ways:
1. **Hosted Cloud Endpoint (Recommended)**: Connect directly to **`https://mcp.datamint.xyz/sse`** with zero local dependencies.
2. **Local CLI / Stdio**: Run via `npx -y @datamint/mcp` locally on your machine.

---

### 1. Get Your Datamint API Key
Sign up at [datamint.xyz](https://datamint.xyz) and create a key in the [Dashboard](https://datamint.xyz/dashboard/keys):
- **Live key**: `mint_live_...` (production credits)
- **Sandbox key**: `mint_test_...` (free testing, metered without deducting credits)

---

### 2. Integration Guides by Client

#### 🎯 Cursor IDE

Cursor supports native **SSE** remote MCP servers directly:

1. Open **Settings** $\to$ **Features** $\to$ **MCP Servers** $\to$ **Add New MCP Server**
2. Configure:
   - **Name**: `datamint`
   - **Type**: `SSE`
   - **URL**: `https://mcp.datamint.xyz/sse`
   - **Headers**:
     ```json
     {
       "Authorization": "Bearer mint_live_YOUR_API_KEY"
     }
     ```

Or paste into your project's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "datamint": {
      "url": "https://mcp.datamint.xyz/sse",
      "headers": {
        "Authorization": "Bearer mint_live_YOUR_API_KEY"
      }
    }
  }
}
```

---

#### 🟣 Claude Desktop

Add Datamint to your `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

##### Option A: Hosted Endpoint via Stdio-to-SSE Bridge (No local build)
```json
{
  "mcpServers": {
    "datamint": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.datamint.xyz/sse",
        "--header",
        "Authorization: Bearer mint_live_YOUR_API_KEY"
      ]
    }
  }
}
```

##### Option B: Native Local Stdio
```json
{
  "mcpServers": {
    "datamint": {
      "command": "npx",
      "args": ["-y", "@datamint/mcp"],
      "env": {
        "DATAMINT_API_KEY": "mint_live_YOUR_API_KEY"
      }
    }
  }
}
```

---

#### 🌊 Windsurf IDE

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "datamint": {
      "serverUrl": "https://mcp.datamint.xyz/sse",
      "headers": {
        "Authorization": "Bearer mint_live_YOUR_API_KEY"
      }
    }
  }
}
```

---

#### ⚡ Claude Code (Terminal CLI)

Run a single command in your terminal to enable Datamint web retrieval in Claude Code:

```bash
claude mcp add --transport sse datamint https://mcp.datamint.xyz/sse --header "Authorization: Bearer mint_live_YOUR_API_KEY"
```

---

#### 🛠️ Cline & Roo Code (VS Code Extension)

In Cline Settings $\to$ **MCP Servers** $\to$ **Add Remote MCP Server**:
- **Name**: `datamint`
- **Transport**: `SSE`
- **Server URL**: `https://mcp.datamint.xyz/sse`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer mint_live_YOUR_API_KEY"
  }
  ```

---

#### 📝 Zed Editor

Add to `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "datamint": {
      "endpoint": "https://mcp.datamint.xyz/sse",
      "headers": {
        "Authorization": "Bearer mint_live_YOUR_API_KEY"
      }
    }
  }
}
```

---

#### 🐍 Python AI Agents (LangChain, LangGraph, LlamaIndex, CrewAI)

Connect any Python agent to `mcp.datamint.xyz` using the official `mcp` library:

```bash
pip install mcp
```

```python
import asyncio
from mcp import ClientSession
from mcp.client.sse import sse_client

DATAMINT_API_KEY = "mint_live_YOUR_API_KEY"
HEADERS = {"Authorization": f"Bearer {DATAMINT_API_KEY}"}

async def run_agent():
    # Connect directly to the hosted Datamint SSE endpoint
    async with sse_client("https://mcp.datamint.xyz/sse", headers=HEADERS) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # 1. Single-page extraction into LLM Markdown
            mint_result = await session.call_tool("datamint_mint", {
                "url": "https://news.ycombinator.com",
                "js": False
            })
            print("Extracted Markdown:\n", mint_result.content[0].text)

            # 2. Zero-code schema extraction into typed JSON
            extract_result = await session.call_tool("datamint_extract", {
                "url": "https://example.com/product/123",
                "schema": "ecommerce_item",
                "stealth": True
            })
            print("Extracted Product Data:\n", extract_result.content[0].text)

if __name__ == "__main__":
    asyncio.run(run_agent())
```

---

#### 🟨 Node.js / TypeScript AI Agents (LangChain.js, Vercel AI SDK)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const API_KEY = "mint_live_YOUR_API_KEY";

const transport = new SSEClientTransport(
  new URL("https://mcp.datamint.xyz/sse"),
  {
    eventSourceInit: {
      headers: { Authorization: `Bearer ${API_KEY}` },
    },
    requestInit: {
      headers: { Authorization: `Bearer ${API_KEY}` },
    },
  }
);

const client = new Client(
  { name: "my-ai-agent", version: "1.0.0" },
  { capabilities: {} }
);

await client.connect(transport);

// Call datamint_mint
const result = await client.callTool({
  name: "datamint_mint",
  arguments: {
    url: "https://example.com/item/1",
    js: true,
    stealth: true,
  },
});

console.log(result.content[0].text);
```

---

## Tools Reference

### `datamint_mint`
Synchronous single-page extraction into clean Markdown or structured JSON.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `url` | `string` | **Yes** | Target web page URL (`http://` or `https://`). |
| `js` | `boolean` | No | Render with headless browser before extracting (5 credits). |
| `stealth` | `boolean` | No | Route through residential proxies with anti-bot bypass & CAPTCHA solving (15 credits). |
| `schema` | `string \| object` | No | Registered schema name (`ecommerce_item`, `article`) or inline JSON Schema (+2 credits). |
| `include_screenshot` | `boolean` | No | Include base64-encoded PNG screenshot as visual evidence. |
| `include_html` | `boolean` | No | Include sanitized HTML DOM in response. |
| `wait_for_selector` | `string` | No | CSS selector to wait for before extracting. |
| `timeout` | `integer` | No | Extraction timeout in seconds. |
| `no_cache` | `boolean` | No | Force fresh extraction and bypass cached responses. |

**Example Agent Usage:**
> "Extract the pricing and product details from `https://store.example.com/item/42` using `datamint_mint` with `js: true`."

---

### `datamint_extract`
Zero-code schema extraction producing typed JSON strictly conforming to a schema.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `url` | `string` | **Yes** | Target web page URL. |
| `schema` | `string \| object` | **Yes** | Registered name (`ecommerce_item`, `article`, `job_posting`, `company_profile`) or custom JSON Schema object. |
| `js` | `boolean` | No | Headless browser rendering (7 credits with schema). |
| `stealth` | `boolean` | No | Stealth residential proxy routing (17 credits with schema). |
| `wait_for_selector` | `string` | No | CSS selector to wait for. |
| `no_cache` | `boolean` | No | Bypass response cache. |

**Example Agent Usage:**
> "Use `datamint_extract` to extract the job requirements and salary range from `https://careers.example.com/senior-engineer` using the `job_posting` schema."

---

### `datamint_crawl`
Initiate an asynchronous deep crawl across a website or domain.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `url` | `string` | **Yes** | Starting seed URL. |
| `max_depth` | `integer` | No | Max hops from seed URL (0 to 10). Default: `1`. |
| `max_pages` | `integer` | No | Max pages to crawl (1 to 1000). Default: `50`. |
| `path_include` | `string` | No | Regex pattern for paths to follow (e.g. `^/docs/.*`). |
| `path_exclude` | `string` | No | Regex pattern for paths to skip (e.g. `\.(pdf\|zip)$`). |
| `stealth` | `boolean` | No | Route entire crawl through residential proxies. |
| `schema` | `string \| object` | No | Schema to extract on every discovered page. |
| `webhook_url` | `string` | No | Optional HTTPS webhook URL notified upon crawl completion. |

---

### `datamint_crawl_status`
Poll progress and retrieve extracted pages from a crawl job.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `job_id` | `string` | **Yes** | Crawl UUID returned by `datamint_crawl`. |
| `include_pages` | `boolean` | No | Include page contents (default: `true`). |
| `limit` | `integer` | No | Max pages to return in response (default: `20`). |

---

### `datamint_estimate_cost`
Pre-flight calculation of credit cost and USD value before initiating work.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `mode` | `"mint" \| "extract" \| "crawl"` | **Yes** | Workload operation type. |
| `js` | `boolean` | No | Dynamic browser rendering enabled. |
| `stealth` | `boolean` | No | Stealth residential routing enabled. |
| `has_schema` | `boolean` | No | Schema extraction pass enabled. |
| `pages` | `integer` | No | Estimated page count (for crawls). |

---

## Resources Reference

Agents can read these resources directly using MCP resource requests:

| Resource URI | Description |
| :--- | :--- |
| `datamint://schemas` | Catalog of all canonical registered schemas and required fields. |
| `datamint://schemas/{name}` | Full JSON Schema definition for a registered schema (`ecommerce_item`, `article`, `job_posting`, `company_profile`, `real_estate_listing`, `faq`). |
| `datamint://system/status` | Live health, worker count, queue depth, and proxy tier readiness. |
| `datamint://crawls/{id}` | Direct resource view of a crawl job by UUID. |

---

## Prompts Reference

Pre-configured agent workflows available via `prompts/get`:

- **`research_target`**: Autonomous research template with automatic tier escalation (fast fetch $\to$ JS render $\to$ stealth bypass).
- **`extract_structured_data`**: Guided schema extraction with pre-flight schema inspection.
- **`crawl_knowledge_base`**: Multi-page documentation scraping workflow with cost estimation and status polling.

---

## Credit Unit Economics

Datamint operates on a transparent Data Credits model: **$1.00 USD = 1,000 Credits** ($0.001 / credit).

| Workload Tier | Credits / Page | Cost / 1k Pages | Best For |
| :--- | :---: | :---: | :--- |
| **Static Fast Fetch** | 1 credit | $1.00 | Static blogs, news, public documentation |
| **Static + Schema** | 3 credits | $3.00 | Static pages requiring structured JSON |
| **Dynamic Headless Render** | 5 credits | $5.00 | SPAs (React/Vue/Angular), hydrated DOMs |
| **Dynamic + Schema** | 7 credits | $7.00 | Dynamic pages extracted to JSON |
| **Stealth Armor Bypass** | 15 credits | $15.00 | Cloudflare Turnstile, DataDome, Kasada |
| **Stealth + Schema** | 17 credits | $17.00 | Heavy bot-defended e-commerce and directories |

> **Datamint Zero-Waste Guarantee:** A blocked request that returns zero usable data costs 0 credits.

---

## Hosting as an SSE Service

To deploy as a hosted Server-Sent Events (SSE) server (e.g. for `mcp.datamint.xyz` or inside Docker):

```bash
# Start SSE server on port 3001
datamint-mcp --transport sse --port 3001 --host 0.0.0.0
```

Endpoints exposed:
- `GET /sse`: SSE stream endpoint for clients to establish connection.
- `POST /message`: Message ingress for JSON-RPC messages.
- `GET /health`: Health check endpoint returning HTTP 200.

### Docker Deployment

```bash
docker build -t datamint-mcp .
docker run -d -p 3001:3001 -e DATAMINT_API_KEY=mint_live_xxx datamint-mcp
```

---

## Development & Testing

```bash
# Install dependencies
pnpm install

# Compile TypeScript
pnpm run build

# Run unit and protocol tests
pnpm test

# Typecheck
pnpm run typecheck
```

## CI/CD & Automated Releases

This repository includes continuous integration and automated release workflows via GitHub Actions:

- **`.github/workflows/ci.yml`**:
  - Automatically runs on every push and pull request to `main`.
  - Executes strict TypeScript typechecks (`pnpm run typecheck`).
  - Tests across a matrix of Node.js versions (**18.x, 20.x, 22.x**).
  - Verifies CLI binary execution and stdio JSON-RPC handshake.
  - Tests Docker container build.

- **`.github/workflows/release.yml`**:
  - Automatically triggers when a semver tag is pushed (e.g. `v0.1.1`).
  - Can be manually triggered from the **Actions** tab in GitHub (`workflow_dispatch`) with automatic version incrementing (`patch`, `minor`, `major`).
  - Generates GitHub Release notes automatically.
  - Publishes the package to the npm registry with npm provenance.

### Local Versioning & Release Commands

```bash
# Bump patch version (0.1.0 -> 0.1.1), run typechecks & tests, and rebuild
pnpm run release:patch

# Bump minor version (0.1.0 -> 0.2.0)
pnpm run release:minor

# Bump major version (0.1.0 -> 1.0.0)
pnpm run release:major

# Test package release contents locally without publishing
pnpm run release:dry-run
```

---

## License

MIT © [datamint.xyz](https://datamint.xyz)
