/**
 * Simple JWT auth persistence for OpenClaw API.
 * Token is kept in memory and synced to localStorage for refresh survival.
 */

const STORAGE_KEY = "openclaw_jwt";

let token: string | null =
  typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;

export function getToken(): string | null {
  return token;
}

export function setToken(t: string): void {
  token = t;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, t);
  }
}

export function clearToken(): void {
  token = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/** Headers to attach to authenticated API requests (crisis, etc.). */
export function getAuthHeaders(): Record<string, string> {
  const t = getToken();
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
}

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")
    : "http://localhost:8080";

/** Call POST /api/v1/auth/login and store the returned token. Use test_director or test_responder. */
export async function login(username: string): Promise<{ role: string }> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Login failed: ${res.status}`);
  }
  const data = (await res.json()) as { token: string; role: string };
  setToken(data.token);
  return { role: data.role };
}
