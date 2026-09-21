/**
 * TypeScript types matching datamint.xyz API contracts.
 */

export interface WorkloadProfile {
  js: boolean;
  stealth: boolean;
  schema: boolean;
}

export interface MintMetadata {
  confidence: number;
  low_confidence: boolean;
  fallback_applied: boolean;
  tier: "tier1_fast" | "tier2_browser" | "tier3_stealth" | "cache" | string;
  cached: boolean;
  captcha_solved: boolean;
  credits: number;
  balance_after: number;
  latency_ms: number;
  minted_at: string;
}

export interface MintEvidence {
  html?: string;
  screenshot?: string; // base64 encoded png
}

export interface MintRequest {
  url: string;
  js?: boolean;
  stealth?: boolean;
  schema?: string | Record<string, unknown>;
  include_screenshot?: boolean;
  include_html?: boolean;
  wait_for_selector?: string;
  expected_content_selector?: string;
  proxy?: string;
  headers?: Record<string, string>;
  timeout?: number;
  no_cache?: boolean;
}

export interface MintResponse {
  markdown: string;
  structured?: Record<string, unknown>;
  evidence?: MintEvidence;
  schema?: Record<string, unknown>;
  url: string;
  _mint_meta: MintMetadata;
}

export interface ExtractRequest {
  url: string;
  schema: string | Record<string, unknown>;
  js?: boolean;
  stealth?: boolean;
  wait_for_selector?: string;
  expected_content_selector?: string;
  proxy?: string;
  headers?: Record<string, string>;
  timeout?: number;
  no_cache?: boolean;
}

export interface SchemaReport {
  valid: boolean;
  violations?: Array<{
    path?: string;
    message?: string;
    instance_path?: string;
  }>;
}

export interface ExtractResponse {
  data: Record<string, unknown>;
  schema: SchemaReport;
  markdown?: string;
  structured?: Record<string, unknown>;
  evidence?: MintEvidence;
  _mint_meta: MintMetadata;
}

export interface CrawlRequest {
  url: string;
  max_depth?: number; // 0 to 10
  max_pages?: number; // 1 to 1000
  path_include?: string; // regex
  path_exclude?: string; // regex
  webhook_url?: string;
  stealth?: boolean;
  schema?: string | Record<string, unknown>;
}

export interface CrawlResponse {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  seed_url: string;
  max_depth: number;
  max_pages: number;
  credits_per_page: number;
  _meta: {
    note: string;
    poll: string;
  };
}

export interface CrawlPage {
  id: string;
  job_id: string;
  url: string;
  depth: number;
  status: "pending" | "fetching" | "completed" | "failed";
  credits: number;
  confidence?: number;
  markdown?: string;
  data?: Record<string, unknown>;
  error?: string;
  fetched_at?: string;
}

export interface CrawlStatusResponse {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  seed_url: string;
  max_depth: number;
  max_pages: number;
  pages_done: number;
  pages_failed: number;
  credits_used: number;
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  pages?: CrawlPage[];
}

export interface HealthResponse {
  status: "ok" | "degraded" | "unreachable";
  service: string;
  version: string;
  crawler?: {
    status?: string;
    browser_alive?: boolean;
    queue_depth?: number;
    active_workers?: number;
    max_workers?: number;
  };
  max_inflight?: number;
  available_permits?: number;
}

export interface ApiErrorDetail {
  code:
    | "unauthorized"
    | "invalid_request"
    | "insufficient_credits"
    | "not_implemented"
    | "rate_limited"
    | "internal_error"
    | "not_found"
    | string;
  message: string;
  required?: number;
  balance?: number;
  estimated_credits?: number;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export interface CostEstimate {
  workload: WorkloadProfile;
  creditCostPerPage: number;
  totalEstimatedCredits: number;
  costInUsd: number;
  explanation: string;
}
