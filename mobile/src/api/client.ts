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

// In-memory access token, set by the auth layer. Authenticated requests use it.
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = false } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
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

// --- M2: playable loop ---

export interface NextItem {
  item_type: "new_lesson" | "review" | "none";
  reason: string;
  lesson: { id: number; title: string } | null;
  estimated_exercises: number;
}

export interface ExerciseDTO {
  id: number;
  type: "multiple_choice" | "matching" | "listening" | "typing";
  skill_ids: number[];
  payload: {
    prompt_mode?: string;
    prompt?: { hebrew?: string; image_url?: string; audio_url?: string };
    options?: string[];
    answer?: string;
    [key: string]: unknown;
  };
}

export interface LessonDTO {
  id: number;
  title: string;
  exercises: ExerciseDTO[];
}

export interface AttemptInput {
  exercise_id: number;
  is_correct: boolean;
  latency_ms?: number;
  answer_given?: string;
}

export interface AttemptResult {
  recorded: number;
  lesson_status: string;
  xp_awarded: number;
  current_streak: number;
}

export function getNext(): Promise<NextItem> {
  return request<NextItem>("/me/next", { auth: true });
}

export function getLesson(id: number): Promise<LessonDTO> {
  return request<LessonDTO>(`/lessons/${id}`, { auth: true });
}

export function postAttempts(
  lessonId: number,
  attempts: AttemptInput[],
): Promise<AttemptResult> {
  return request<AttemptResult>("/attempts", {
    method: "POST",
    auth: true,
    body: { lesson_id: lessonId, attempts },
  });
}
