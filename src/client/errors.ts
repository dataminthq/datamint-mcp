import type { ApiErrorDetail } from "./types.js";

/**
 * Custom error class for Datamint API errors with actionable guidance.
 */
export class DatamintApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: ApiErrorDetail;
  public readonly guidance?: string;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: ApiErrorDetail,
  ) {
    super(message);
    this.name = "DatamintApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.guidance = getErrorGuidance(code, status, details);
  }

  /**
   * Return a formatted message suitable for AI agent context.
   */
  public toAgentMessage(): string {
    let out = `Datamint API Error [${this.code}] (${this.status}): ${this.message}`;
    if (this.guidance) {
      out += `\nSuggestion: ${this.guidance}`;
    }
    if (this.details?.required !== undefined && this.details?.balance !== undefined) {
      out += `\n(Required credits: ${this.details.required}, Current balance: ${this.details.balance})`;
    }
    return out;
  }
}

/**
 * Derive user/agent actionable guidance based on error code and details.
 */
function getErrorGuidance(
  code: string,
  status: number,
  details?: ApiErrorDetail,
): string | undefined {
  switch (code) {
    case "unauthorized":
      return (
        "Check that DATAMINT_API_KEY is configured correctly. " +
        "Keys begin with 'mint_live_' (production) or 'mint_test_' (sandbox). " +
        "You can manage your API keys at https://datamint.xyz/dashboard/keys."
      );
    case "insufficient_credits": {
      const req = details?.required;
      const bal = details?.balance;
      return (
        `Your account has ${bal ?? 0} credits but this request requires ${req ?? "more"}. ` +
        "Sandbox keys ('mint_test_...') can be used for testing without consuming credits, " +
        "or upgrade/top up your credits at https://datamint.xyz/pricing."
      );
    }
    case "invalid_request":
      return (
        "Verify that target URL is a valid, publicly reachable http or https URL. " +
        "Internal, loopback, or cloud-metadata URLs are blocked. " +
        "If using JSON Schema, ensure it is a valid JSON Schema object."
      );
    case "rate_limited":
      return "You have exceeded concurrent request limits. Please wait a moment before retrying.";
    case "not_implemented":
      return "The requested extraction feature is currently undergoing scheduled maintenance.";
    case "internal_error":
      if (status === 502) {
        return (
          "The extraction engine is temporarily unreachable. " +
          "If running locally, ensure datamint-backend is running at http://127.0.0.1:4000."
        );
      }
      return "Datamint encountered an internal error. Please retry shortly.";
    default:
      return undefined;
  }
}
