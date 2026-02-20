/**
 * Typed fetch wrapper for the Xero Replica API.
 * All endpoints return { ok: true, data: T } or { ok: false, error: string }.
 * These helpers unwrap the envelope and throw on errors.
 */

const API_BASE = '/api';

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ApiError {
  ok: false;
  error: string;
  details?: unknown;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();
  if (!json.ok) {
    throw new ApiRequestError(
      (json as ApiError).error,
      res.status,
      (json as ApiError).details,
    );
  }
  return (json as ApiSuccess<T>).data;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  return unwrap<T>(res);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, {
    method: 'DELETE',
  });
}
