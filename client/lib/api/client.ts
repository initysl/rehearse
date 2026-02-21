import { getStoredAccessToken } from "../auth-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type QueryValue = string | number | boolean | undefined | null;

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  accessToken?: string | null;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ApiResponseWithMeta<T> {
  status: number;
  data: T;
  headers: Headers;
}

const buildUrl = (
  path: string,
  query?: Record<string, QueryValue>
): string => {
  const url = new URL(path, API_BASE_URL);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
};

const readResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
};

const createHeaders = (options: ApiRequestOptions): HeadersInit => {
  const headers = new Headers(options.headers || {});
  const token = options.accessToken ?? getStoredAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (
    options.body !== undefined &&
    options.body !== null &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
};

export const apiRequestWithMeta = async <T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponseWithMeta<T>> => {
  const response = await fetch(buildUrl(path, options.query), {
    method: options.method || "GET",
    headers: createHeaders(options),
    body:
      options.body === undefined || options.body === null
        ? undefined
        : options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body),
    credentials: "include",
    signal: options.signal,
  });

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    const fallbackMessage =
      typeof responseBody === "object" &&
      responseBody !== null &&
      "error" in responseBody
        ? String((responseBody as { error: unknown }).error)
        : `Request failed with status ${response.status}`;

    throw new ApiError(fallbackMessage, response.status, responseBody);
  }

  return {
    status: response.status,
    data: responseBody as T,
    headers: response.headers,
  };
};

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { data } = await apiRequestWithMeta<T>(path, options);
  return data;
};

export const getApiBaseUrl = (): string => API_BASE_URL;
