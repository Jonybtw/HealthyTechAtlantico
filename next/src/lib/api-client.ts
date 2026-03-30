type ApiEnvelope<T> = { data: T };
type ApiErrorPayload<TIssues = unknown> = {
  error?: string;
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

export async function readApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(payload, `Request failed: ${response.status}`),
    );
  }

  return unwrapApiData(payload as ApiEnvelope<T> | T);
}
