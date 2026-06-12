type ApiEnvelope<T> = { data: T };
type ApiErrorPayload<TIssues = unknown> = {
  error?: string;
  code?: string;
  issues?: TIssues;
};

function unwrapApiData<T>(payload: ApiEnvelope<T> | T): T {
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

export function getApiErrorMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as ApiErrorPayload).error === "string"
  ) {
    return (payload as ApiErrorPayload).error as string;
  }

  return fallback;
}

/**
 * Typed error thrown by `readApiResponse` so pages can branch on
 * `status`, `code`, and `retryAfter` (e.g. show "rate limited — try in 30s").
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly retryAfter?: number;
  public readonly issues?: unknown;

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string;
      retryAfter?: number;
      issues?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.retryAfter = options?.retryAfter;
    this.issues = options?.issues;
  }
}

export async function readApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    const parsed = (payload as ApiErrorPayload | undefined);
    const retryAfterHeader = response.headers.get("Retry-After");
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
    throw new ApiError(
      getApiErrorMessage(parsed, `Request failed: ${response.status}`),
      response.status,
      {
        code: parsed?.code,
        retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
        issues: parsed?.issues,
      },
    );
  }

  return unwrapApiData(payload as ApiEnvelope<T> | T);
}
