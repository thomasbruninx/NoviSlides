import type { ApiResponse } from '../types';

export async function apiFetch<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  const json = (await response.json()) as ApiResponse<T>;
  if (!json.ok) {
    const error = new Error(json.error.message);
    (error as Error & { code?: string; details?: unknown }).code = json.error.code;
    (error as Error & { code?: string; details?: unknown }).details = json.error.details;
    throw error;
  }
  return json.data;
}

export async function apiFetchForm<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const json = (await response.json()) as ApiResponse<T>;
  if (!json.ok) {
    const error = new Error(json.error.message);
    (error as Error & { code?: string; details?: unknown }).code = json.error.code;
    (error as Error & { code?: string; details?: unknown }).details = json.error.details;
    throw error;
  }
  return json.data;
}
