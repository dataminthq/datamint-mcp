import type { DatamintConfig } from "../config.js";
import { DatamintApiError } from "./errors.js";
import type {
  MintRequest,
  MintResponse,
  ExtractRequest,
  ExtractResponse,
  CrawlRequest,
  CrawlResponse,
  CrawlStatusResponse,
  HealthResponse,
  ApiErrorResponse,
  CostEstimate,
  WorkloadProfile,
} from "./types.js";

/**
 * High-performance HTTP client for datamint.xyz APIs.
 */
export class DatamintClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(config: DatamintConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs;
  }

  /**
   * Helper to perform authenticated HTTP requests with retry on transient errors.
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: "GET" | "POST";
      body?: unknown;
      retries?: number;
      apiKey?: string;
    } = {},
  ): Promise<T> {
    const { method = "GET", body, retries = 2, apiKey } = options;
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Accept": "application/json",
      "User-Agent": "datamint-mcp/0.1.0",
    };

    const effectiveKey = (apiKey || this.apiKey)?.trim();
    if (effectiveKey) {
      headers["Authorization"] = `Bearer ${effectiveKey}`;
    }

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= retries) {
      attempt++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timer);

        // Check if response is successful
        if (response.ok) {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            return (await response.json()) as T;
          }
          // In case of non-json body (rare raw markdown response)
          const text = await response.text();
          return { markdown: text } as unknown as T;
        }

        // Parse structured error envelope if present
        let errJson: ApiErrorResponse | null = null;
        try {
          errJson = (await response.json()) as ApiErrorResponse;
        } catch {
          // Response was not JSON
        }

        const code = errJson?.error?.code || `http_${response.status}`;
        const message =
          errJson?.error?.message || response.statusText || "Request failed";

        // If rate limited or courtesy backoff (429 or 503) and we have retries left, back off
        if ((response.status === 429 || response.status === 503) && attempt <= retries) {
          const backoff = attempt * 1000;
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        throw new DatamintApiError(code, message, response.status, errJson?.error);
      } catch (err: unknown) {
        clearTimeout(timer);
        if (err instanceof DatamintApiError) {
          throw err;
        }

        const error = err as Error;
        lastError = error;

        // Abort / timeout
        if (error.name === "AbortError") {
          throw new DatamintApiError(
            "timeout",
            `Request timed out after ${this.timeoutMs}ms`,
            408,
          );
        }

        // Retry network failures
        if (attempt <= retries) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
          continue;
        }
      }
    }

    throw new DatamintApiError(
      "network_error",
      lastError?.message || "Failed to reach Datamint API",
      502,
    );
  }

  /**
   * Synchronous single-page extraction into LLM-optimized Markdown or structured JSON.
   */
  public async mint(request: MintRequest): Promise<MintResponse> {
    return this.request<MintResponse>("/v1/mint", {
      method: "POST",
      body: request,
      apiKey: request.api_key,
    });
  }

  /**
   * Zero-code schema extraction into strictly typed JSON conforming to schema.
   */
  public async extract(request: ExtractRequest): Promise<ExtractResponse> {
    return this.request<ExtractResponse>("/v1/extract", {
      method: "POST",
      body: request,
      apiKey: request.api_key,
    });
  }

  /**
   * Launch an asynchronous deep crawl across a website or domain.
   */
  public async crawl(request: CrawlRequest): Promise<CrawlResponse> {
    return this.request<CrawlResponse>("/v1/crawl", {
      method: "POST",
      body: request,
      apiKey: request.api_key,
    });
  }

  /**
   * Poll status and retrieve extracted pages for an active or completed crawl job.
   */
  public async getCrawlStatus(jobId: string, apiKey?: string): Promise<CrawlStatusResponse> {
    return this.request<CrawlStatusResponse>(`/v1/crawl/${encodeURIComponent(jobId)}`, {
      method: "GET",
      apiKey,
    });
  }

  /**
   * Health probe for backend crawler fleet and API status.
   */
  public async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health", {
      method: "GET",
      retries: 0,
    });
  }

  /**
   * Compute credit cost and dollar estimate for a planned workload.
   */
  public estimateCost(workload: WorkloadProfile, pages: number = 1): CostEstimate {
    // Base cost per page
    let base = 1; // static fetch
    if (workload.stealth) {
      base = 15; // residential proxy stealth armor
    } else if (workload.js) {
      base = 5; // dynamic headless render
    }

    const schemaAddon = workload.schema ? 2 : 0;
    const perPage = base + schemaAddon;
    const totalCredits = perPage * Math.max(1, pages);
    const costInUsd = totalCredits / 1000; // $1 = 1,000 credits

    let explanation = `Base tier: ${
      workload.stealth
        ? "Stealth Armor (15 credits)"
        : workload.js
          ? "Dynamic Headless Browser (5 credits)"
          : "Static Fast Fetch (1 credit)"
    }`;
    if (workload.schema) {
      explanation += " + Schema Extraction pass (2 credits)";
    }
    if (pages > 1) {
      explanation += ` across ${pages} pages`;
    }

    return {
      workload,
      creditCostPerPage: perPage,
      totalEstimatedCredits: totalCredits,
      costInUsd,
      explanation,
    };
  }
}
