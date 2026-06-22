type ApiError = { message?: string };

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  errors?: ApiError[];
}

function compact(text: string): string {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
}

export async function readApiEnvelope<T>(res: Response, path: string): Promise<ApiEnvelope<T>> {
  const text = await res.text();
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const detail = compact(text) || "non-JSON response";
    throw new Error(`API ${res.status} for ${path}: ${detail}`);
  }
  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    throw new Error(`API ${res.status} for ${path}: invalid JSON response`);
  }
}

export function apiError<T>(json: ApiEnvelope<T>, res: Response, path: string): Error {
  return new Error(json.errors?.[0]?.message ?? `API ${res.status} for ${path}`);
}
