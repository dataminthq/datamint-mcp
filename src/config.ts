import dotenv from "dotenv";

// Load environment variables from .env if present
dotenv.config();

export interface DatamintConfig {
  apiKey?: string;
  baseUrl: string;
  timeoutMs: number;
  transport: "stdio" | "sse";
  port: number;
  host: string;
}

export const DEFAULT_BASE_URL = "https://api.datamint.xyz";
export const DEFAULT_TIMEOUT_MS = 60_000;
export const DEFAULT_PORT = 3001;
export const DEFAULT_HOST = "0.0.0.0";

/**
 * Validates that an API key matches Datamint format:
 * - mint_live_[32 hex characters]
 * - mint_test_[32 hex characters]
 */
export function looksLikeApiKey(key: string): boolean {
  if (typeof key !== "string") return false;
  const trimmed = key.trim();
  return (
    (trimmed.startsWith("mint_live_") || trimmed.startsWith("mint_test_")) &&
    trimmed.length >= 20
  );
}

/**
 * Parse CLI args and environment variables into a unified config object.
 */
export function resolveConfig(argv: string[] = process.argv.slice(2)): DatamintConfig {
  let apiKey = process.env.DATAMINT_API_KEY?.trim();
  let baseUrl = process.env.DATAMINT_BASE_URL?.trim() || DEFAULT_BASE_URL;
  let timeoutMs = process.env.DATAMINT_TIMEOUT
    ? parseInt(process.env.DATAMINT_TIMEOUT, 10)
    : DEFAULT_TIMEOUT_MS;
  let transport: "stdio" | "sse" =
    (process.env.DATAMINT_TRANSPORT?.toLowerCase() as "stdio" | "sse") || "stdio";
  let port = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;
  let host = process.env.HOST || DEFAULT_HOST;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--api-key" && i + 1 < argv.length) {
      apiKey = argv[++i].trim();
    } else if (arg.startsWith("--api-key=")) {
      apiKey = arg.split("=")[1].trim();
    } else if (arg === "--base-url" && i + 1 < argv.length) {
      baseUrl = argv[++i].trim();
    } else if (arg.startsWith("--base-url=")) {
      baseUrl = arg.split("=")[1].trim();
    } else if (arg === "--transport" && i + 1 < argv.length) {
      const val = argv[++i].toLowerCase();
      if (val === "stdio" || val === "sse") transport = val;
    } else if (arg.startsWith("--transport=")) {
      const val = arg.split("=")[1].toLowerCase();
      if (val === "stdio" || val === "sse") transport = val;
    } else if (arg === "--port" && i + 1 < argv.length) {
      port = parseInt(argv[++i], 10) || DEFAULT_PORT;
    } else if (arg.startsWith("--port=")) {
      port = parseInt(arg.split("=")[1], 10) || DEFAULT_PORT;
    } else if (arg === "--host" && i + 1 < argv.length) {
      host = argv[++i].trim();
    } else if (arg.startsWith("--host=")) {
      host = arg.split("=")[1].trim();
    } else if (arg === "--timeout" && i + 1 < argv.length) {
      timeoutMs = parseInt(argv[++i], 10) || DEFAULT_TIMEOUT_MS;
    } else if (arg.startsWith("--timeout=")) {
      timeoutMs = parseInt(arg.split("=")[1], 10) || DEFAULT_TIMEOUT_MS;
    } else if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  // Strip trailing slashes from baseUrl
  baseUrl = baseUrl.replace(/\/+$/, "");

  return {
    apiKey,
    baseUrl,
    timeoutMs,
    transport,
    port,
    host,
  };
}

export function printHelp(): void {
  console.log(`
datamint-mcp — Official Model Context Protocol server for datamint.xyz

Usage:
  npx @datamint/mcp [options]
  datamint-mcp [options]

Options:
  --api-key <key>       Datamint API key (mint_live_... or mint_test_...)
                        Can also be passed via DATAMINT_API_KEY env variable
  --base-url <url>      Datamint API base URL (default: https://api.datamint.xyz)
  --transport <mode>    Protocol transport: "stdio" (default) or "sse"
  --port <port>         Port to listen on for SSE transport (default: 3001)
  --host <host>         Host to bind for SSE transport (default: 0.0.0.0)
  --timeout <ms>        Request timeout in milliseconds (default: 60000)
  -h, --help            Show this help message

Environment Variables:
  DATAMINT_API_KEY      Your API key from https://datamint.xyz/dashboard/keys
  DATAMINT_BASE_URL     Custom API endpoint (e.g. http://127.0.0.1:4000)
  DATAMINT_TRANSPORT    "stdio" | "sse"
  PORT                  Port for SSE mode
  DATAMINT_TIMEOUT      Timeout in milliseconds
`);
}
