import { API_BASE_URL } from "../config";

export interface Player {
  id: number;
  display_name: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
}

export interface AuthResult {
  access: string;
  refresh: string;
  player?: Player;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      "Network error - is the backend running and reachable?",
      0,
      err,
    );
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(extractError(data), response.status, data);
  }
  return data as T;
}

function extractError(data: unknown): string {
  if (data && typeof data === "object") {
    const values = Object.values(data as Record<string, unknown>).flat();
    if (values.length) {
      return String(values[0]);
    }
  }
  return "Request failed";
}

export function register(input: {
  email: string;
  password: string;
  display_name: string;
}): Promise<AuthResult> {
  return request<AuthResult>("/auth/register", { method: "POST", body: input });
}

export function login(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  return request<AuthResult>("/auth/login", { method: "POST", body: input });
}
